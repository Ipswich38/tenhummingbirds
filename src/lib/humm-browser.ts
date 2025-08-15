// Humm Browser Tool - Core browser automation for TenHummingbirds AI Agent
// Phase 1: Basic navigation, element interaction, and content extraction

import { chromium, Browser, Page, BrowserContext } from 'playwright'
import * as cheerio from 'cheerio'

export interface HummCommand {
  action: 'navigate' | 'click' | 'input' | 'extract' | 'scroll' | 'screenshot' | 'wait' | 'stream_start' | 'stream_stop' | 'get_viewport'
  url?: string
  selector?: string
  text?: string
  options?: Record<string, unknown>
}

export interface HummObservation {
  success: boolean
  data?: Record<string, unknown>
  screenshot?: string
  pageTitle?: string
  url?: string
  content?: string
  error?: string
  timestamp: number
  viewport?: {
    width: number
    height: number
    deviceScaleFactor: number
  }
  streamData?: {
    isStreaming: boolean
    frameRate: number
    quality: number
  }
}

export class HummBrowser {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private isInitialized = false
  private isStreaming = false
  private streamInterval: NodeJS.Timeout | null = null
  private streamCallback: ((screenshot: string) => void) | null = null

  async initialize(): Promise<void> {
    // Disable browser automation in production if environment variable is set
    if (process.env.DISABLE_BROWSER_AUTOMATION === 'true') {
      throw new Error('Browser automation is disabled in production')
    }

    try {
      // Launch browser in headless mode for production, headed for development
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      // Create a new browser context with realistic user agent
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 }
      })
      
      // Create a new page
      this.page = await this.context.newPage()
      
      // Set reasonable timeouts
      this.page.setDefaultTimeout(30000)
      
      this.isInitialized = true
      console.log('🚀 Humm Browser initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Humm Browser:', error)
      throw error
    }
  }

  async executeCommand(command: HummCommand): Promise<HummObservation> {
    if (!this.isInitialized || !this.page) {
      await this.initialize()
    }

    const startTime = Date.now()
    
    try {
      switch (command.action) {
        case 'navigate':
          return await this.navigate(command.url!)
        
        case 'click':
          return await this.click(command.selector!)
        
        case 'input':
          return await this.input(command.selector!, command.text!)
        
        case 'extract':
          return await this.extractContent(command.selector)
        
        case 'scroll':
          return await this.scroll(command.options)
        
        case 'screenshot':
          return await this.takeScreenshot()
        
        case 'wait':
          return await this.waitForElement(command.selector!, command.options?.timeout)
        
        case 'stream_start':
          return await this.startStreaming(command.options?.callback, command.options?.frameRate)
        
        case 'stream_stop':
          return await this.stopStreaming()
        
        case 'get_viewport':
          return await this.getViewportInfo()
        
        default:
          throw new Error(`Unknown command action: ${command.action}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: startTime
      }
    }
  }

  private async navigate(url: string): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' })
      
      const pageTitle = await this.page.title()
      const currentUrl = this.page.url()
      
      return {
        success: true,
        pageTitle,
        url: currentUrl,
        data: { navigated: true },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async click(selector: string): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      await this.page.waitForSelector(selector, { timeout: 10000 })
      await this.page.click(selector)
      
      // Wait a moment for any resulting page changes
      await this.page.waitForTimeout(1000)
      
      return {
        success: true,
        data: { clicked: selector },
        url: this.page.url(),
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Click failed on ${selector}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async input(selector: string, text: string): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      await this.page.waitForSelector(selector, { timeout: 10000 })
      await this.page.fill(selector, text)
      
      return {
        success: true,
        data: { inputted: text, selector },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Input failed on ${selector}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async extractContent(selector?: string): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      let content: string | Record<string, unknown>
      
      if (selector) {
        // Extract specific element content
        const element = await this.page.$(selector)
        if (element) {
          content = await element.textContent()
        } else {
          throw new Error(`Element not found: ${selector}`)
        }
      } else {
        // Extract full page content
        const html = await this.page.content()
        const $ = cheerio.load(html)
        
        // Remove script and style elements
        $('script, style, nav, footer, .ad, .advertisement').remove()
        
        content = {
          title: await this.page.title(),
          text: $('body').text().replace(/\s+/g, ' ').trim(),
          html: $.html(),
          url: this.page.url()
        }
      }
      
      return {
        success: true,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        data: content,
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async scroll(options: Record<string, unknown> = {}): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      const { direction = 'down', pixels = 500, toElement } = options
      
      if (toElement) {
        // Scroll to specific element
        await this.page.locator(toElement).scrollIntoViewIfNeeded()
      } else {
        // Scroll by pixels
        const scrollY = direction === 'down' ? pixels : -pixels
        await this.page.evaluate((y) => window.scrollBy(0, y), scrollY)
      }
      
      return {
        success: true,
        data: { scrolled: true, direction, pixels },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Scroll failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async takeScreenshot(): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      const screenshot = await this.page.screenshot({ 
        type: 'png',
        fullPage: false // Just visible area for faster processing
      })
      
      const base64Screenshot = screenshot.toString('base64')
      
      return {
        success: true,
        screenshot: `data:image/png;base64,${base64Screenshot}`,
        data: { screenshotTaken: true },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Screenshot failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async waitForElement(selector: string, timeout = 10000): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      await this.page.waitForSelector(selector, { timeout })
      
      return {
        success: true,
        data: { elementFound: selector },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Wait failed for ${selector}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCurrentState(): Promise<HummObservation> {
    if (!this.page) {
      return {
        success: false,
        error: 'Browser not initialized',
        timestamp: Date.now()
      }
    }

    try {
      const pageTitle = await this.page.title()
      const url = this.page.url()
      const viewport = this.page.viewportSize()
      
      return {
        success: true,
        pageTitle,
        url,
        viewport: viewport ? {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1
        } : undefined,
        streamData: {
          isStreaming: this.isStreaming,
          frameRate: this.streamInterval ? 2 : 0,
          quality: 60
        },
        data: { 
          isReady: true,
          title: pageTitle,
          currentUrl: url,
          isStreaming: this.isStreaming
        },
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    }
  }

  private async startStreaming(callback?: (screenshot: string) => void, frameRate: number = 2): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      this.streamCallback = callback || null
      this.isStreaming = true
      
      // Start streaming screenshots at specified frame rate
      this.streamInterval = setInterval(async () => {
        try {
          const screenshot = await this.page!.screenshot({ 
            type: 'png',
            fullPage: false,
            quality: 60
          })
          
          const base64Screenshot = `data:image/png;base64,${screenshot.toString('base64')}`
          
          if (this.streamCallback) {
            this.streamCallback(base64Screenshot)
          }
        } catch (error) {
          console.error('Stream screenshot error:', error)
        }
      }, 1000 / frameRate)
      
      return {
        success: true,
        streamData: {
          isStreaming: true,
          frameRate: frameRate,
          quality: 60
        },
        data: { streamingStarted: true },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Failed to start streaming: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async stopStreaming(): Promise<HummObservation> {
    try {
      this.isStreaming = false
      
      if (this.streamInterval) {
        clearInterval(this.streamInterval)
        this.streamInterval = null
      }
      
      this.streamCallback = null
      
      return {
        success: true,
        streamData: {
          isStreaming: false,
          frameRate: 0,
          quality: 0
        },
        data: { streamingStopped: true },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Failed to stop streaming: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getViewportInfo(): Promise<HummObservation> {
    if (!this.page) throw new Error('Page not initialized')
    
    try {
      const viewport = this.page.viewportSize()
      const url = this.page.url()
      const title = await this.page.title()
      
      return {
        success: true,
        pageTitle: title,
        url: url,
        viewport: viewport ? {
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1
        } : undefined,
        data: {
          viewport: viewport,
          currentUrl: url,
          title: title
        },
        timestamp: Date.now()
      }
    } catch (error) {
      throw new Error(`Failed to get viewport info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async close(): Promise<void> {
    try {
      // Stop streaming if active
      if (this.isStreaming) {
        await this.stopStreaming()
      }
      
      if (this.context) await this.context.close()
      if (this.browser) await this.browser.close()
      this.isInitialized = false
      console.log('🔒 Humm Browser closed successfully')
    } catch (error) {
      console.error('❌ Error closing Humm Browser:', error)
    }
  }
}

// Singleton instance for the application
export const hummBrowser = new HummBrowser()