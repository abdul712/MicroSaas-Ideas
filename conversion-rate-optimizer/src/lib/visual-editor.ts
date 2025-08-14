export interface VisualElement {
  id: string
  type: ElementType
  selector: string
  originalContent?: string
  modifications: ElementModification[]
  position: DOMRect
  isEditable: boolean
  parentId?: string
  children?: string[]
}

export interface ElementModification {
  id: string
  type: ModificationType
  property: string
  originalValue: any
  newValue: any
  cssRule?: string
  javascript?: string
}

export interface TestVariation {
  id: string
  name: string
  changes: VisualChange[]
  isControl: boolean
  trafficPercentage: number
}

export interface VisualChange {
  elementId: string
  selector: string
  type: ChangeType
  before: any
  after: any
  css?: string
  html?: string
  attributes?: Record<string, string>
}

export type ElementType = 
  | 'text'
  | 'image'
  | 'button'
  | 'link'
  | 'form'
  | 'container'
  | 'video'
  | 'list'

export type ModificationType =
  | 'text_content'
  | 'style'
  | 'attribute'
  | 'html'
  | 'remove'
  | 'add'
  | 'move'
  | 'hide'
  | 'show'

export type ChangeType =
  | 'text'
  | 'color'
  | 'background'
  | 'size'
  | 'position'
  | 'visibility'
  | 'content'
  | 'style'

export class VisualEditor {
  private targetWindow: Window | null = null
  private targetDocument: Document | null = null
  private selectedElement: VisualElement | null = null
  private elements: Map<string, VisualElement> = new Map()
  private modifications: Map<string, ElementModification[]> = new Map()
  private observers: MutationObserver[] = []

  constructor() {
    this.initializeEditor()
  }

  /**
   * Initialize the visual editor
   */
  private initializeEditor(): void {
    // Add editor styles to prevent interference
    this.injectEditorStyles()
    
    // Set up event listeners
    this.setupEventListeners()
  }

  /**
   * Load a page for editing
   */
  async loadPage(url: string): Promise<void> {
    try {
      // Create iframe for safe editing
      const iframe = this.createEditingIframe(url)
      document.body.appendChild(iframe)

      await this.waitForIframeLoad(iframe)
      
      this.targetWindow = iframe.contentWindow
      this.targetDocument = iframe.contentDocument

      if (!this.targetDocument) {
        throw new Error('Failed to load target document')
      }

      // Scan and index all editable elements
      await this.scanPage()
      
      // Enable editing mode
      this.enableEditingMode()

    } catch (error) {
      console.error('Failed to load page for editing:', error)
      throw error
    }
  }

  /**
   * Scan page and identify editable elements
   */
  private async scanPage(): Promise<void> {
    if (!this.targetDocument) return

    const editableSelectors = [
      'h1, h2, h3, h4, h5, h6', // Headings
      'p', // Paragraphs
      'a', // Links
      'button', // Buttons
      'input[type="submit"], input[type="button"]', // Input buttons
      'img', // Images
      'span', // Spans
      'div[class*="button"], div[class*="cta"]', // Button-like divs
      '.editable', // Explicitly marked editable
    ]

    const elements = this.targetDocument.querySelectorAll(editableSelectors.join(', '))
    
    elements.forEach((element, index) => {
      const visualElement = this.createVisualElement(element as HTMLElement, index)
      this.elements.set(visualElement.id, visualElement)
    })
  }

  /**
   * Create visual element representation
   */
  private createVisualElement(element: HTMLElement, index: number): VisualElement {
    const id = `element_${index}_${Date.now()}`
    const rect = element.getBoundingClientRect()
    
    return {
      id,
      type: this.getElementType(element),
      selector: this.generateUniqueSelector(element),
      originalContent: this.getElementContent(element),
      modifications: [],
      position: rect,
      isEditable: this.isElementEditable(element),
      parentId: this.getParentElementId(element),
    }
  }

  /**
   * Generate unique CSS selector for element
   */
  private generateUniqueSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).slice(0, 2)
      if (classes.length > 0) {
        const selector = `${element.tagName.toLowerCase()}.${classes.join('.')}`
        const matches = this.targetDocument?.querySelectorAll(selector)
        if (matches && matches.length === 1) {
          return selector
        }
      }
    }

    // Generate nth-child selector
    const parent = element.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(element) + 1
      const parentSelector = this.generateUniqueSelector(parent)
      return `${parentSelector} > ${element.tagName.toLowerCase()}:nth-child(${index})`
    }

    return element.tagName.toLowerCase()
  }

  /**
   * Enable editing mode on the target page
   */
  private enableEditingMode(): void {
    if (!this.targetDocument) return

    // Add editor overlay
    this.createEditorOverlay()

    // Add element highlighting
    this.setupElementHighlighting()

    // Add click handlers for element selection
    this.setupElementSelection()

    // Add mutation observer to track changes
    this.setupMutationObserver()
  }

  /**
   * Create editor overlay with tools
   */
  private createEditorOverlay(): void {
    if (!this.targetDocument) return

    const overlay = this.targetDocument.createElement('div')
    overlay.id = 'cro-editor-overlay'
    overlay.innerHTML = `
      <div class="cro-editor-toolbar">
        <button id="cro-text-tool">Text</button>
        <button id="cro-style-tool">Style</button>
        <button id="cro-layout-tool">Layout</button>
        <button id="cro-image-tool">Image</button>
        <button id="cro-save-tool">Save</button>
        <button id="cro-preview-tool">Preview</button>
      </div>
      <div class="cro-editor-panel" id="cro-editor-panel">
        <!-- Dynamic editor panel content -->
      </div>
    `

    this.targetDocument.body.appendChild(overlay)
    this.setupToolbarListeners()
  }

  /**
   * Setup element highlighting on hover
   */
  private setupElementHighlighting(): void {
    if (!this.targetDocument) return

    this.elements.forEach(element => {
      const domElement = this.targetDocument!.querySelector(element.selector) as HTMLElement
      if (!domElement) return

      domElement.addEventListener('mouseenter', () => {
        this.highlightElement(domElement)
      })

      domElement.addEventListener('mouseleave', () => {
        this.removeHighlight(domElement)
      })
    })
  }

  /**
   * Setup element selection
   */
  private setupElementSelection(): void {
    if (!this.targetDocument) return

    this.elements.forEach(element => {
      const domElement = this.targetDocument!.querySelector(element.selector) as HTMLElement
      if (!domElement) return

      domElement.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.selectElement(element.id)
      })
    })
  }

  /**
   * Select element for editing
   */
  selectElement(elementId: string): void {
    const element = this.elements.get(elementId)
    if (!element) return

    this.selectedElement = element
    this.showElementEditor(element)
    this.highlightSelectedElement(element)
  }

  /**
   * Show editor panel for selected element
   */
  private showElementEditor(element: VisualElement): void {
    const panel = this.targetDocument?.getElementById('cro-editor-panel')
    if (!panel) return

    panel.innerHTML = this.generateEditorPanelHTML(element)
    panel.style.display = 'block'
    this.setupEditorPanelListeners(element)
  }

  /**
   * Generate editor panel HTML based on element type
   */
  private generateEditorPanelHTML(element: VisualElement): string {
    const baseHTML = `
      <div class="cro-editor-header">
        <h3>Edit ${element.type}</h3>
        <button class="cro-close-editor">×</button>
      </div>
    `

    switch (element.type) {
      case 'text':
        return baseHTML + this.generateTextEditorHTML(element)
      case 'button':
        return baseHTML + this.generateButtonEditorHTML(element)
      case 'image':
        return baseHTML + this.generateImageEditorHTML(element)
      case 'link':
        return baseHTML + this.generateLinkEditorHTML(element)
      default:
        return baseHTML + this.generateGenericEditorHTML(element)
    }
  }

  /**
   * Generate text editor HTML
   */
  private generateTextEditorHTML(element: VisualElement): string {
    return `
      <div class="cro-editor-section">
        <label>Text Content:</label>
        <textarea id="cro-text-content" rows="3">${element.originalContent || ''}</textarea>
      </div>
      <div class="cro-editor-section">
        <label>Font Size:</label>
        <input type="range" id="cro-font-size" min="10" max="72" value="16">
        <span id="cro-font-size-value">16px</span>
      </div>
      <div class="cro-editor-section">
        <label>Text Color:</label>
        <input type="color" id="cro-text-color" value="#000000">
      </div>
      <div class="cro-editor-section">
        <label>Font Weight:</label>
        <select id="cro-font-weight">
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Lighter</option>
        </select>
      </div>
      <div class="cro-editor-actions">
        <button id="cro-apply-changes">Apply Changes</button>
        <button id="cro-reset-changes">Reset</button>
      </div>
    `
  }

  /**
   * Generate button editor HTML
   */
  private generateButtonEditorHTML(element: VisualElement): string {
    return `
      <div class="cro-editor-section">
        <label>Button Text:</label>
        <input type="text" id="cro-button-text" value="${element.originalContent || ''}">
      </div>
      <div class="cro-editor-section">
        <label>Background Color:</label>
        <input type="color" id="cro-button-bg" value="#007cba">
      </div>
      <div class="cro-editor-section">
        <label>Text Color:</label>
        <input type="color" id="cro-button-text-color" value="#ffffff">
      </div>
      <div class="cro-editor-section">
        <label>Border Radius:</label>
        <input type="range" id="cro-button-radius" min="0" max="50" value="4">
        <span id="cro-button-radius-value">4px</span>
      </div>
      <div class="cro-editor-section">
        <label>Padding:</label>
        <input type="range" id="cro-button-padding" min="5" max="30" value="12">
        <span id="cro-button-padding-value">12px</span>
      </div>
      <div class="cro-editor-actions">
        <button id="cro-apply-changes">Apply Changes</button>
        <button id="cro-reset-changes">Reset</button>
      </div>
    `
  }

  /**
   * Apply modifications to element
   */
  applyModification(elementId: string, modification: ElementModification): void {
    const element = this.elements.get(elementId)
    if (!element) return

    const domElement = this.targetDocument?.querySelector(element.selector) as HTMLElement
    if (!domElement) return

    switch (modification.type) {
      case 'text_content':
        domElement.textContent = modification.newValue
        break
      case 'style':
        (domElement.style as any)[modification.property] = modification.newValue
        break
      case 'attribute':
        domElement.setAttribute(modification.property, modification.newValue)
        break
      case 'html':
        domElement.innerHTML = modification.newValue
        break
    }

    // Store modification
    const elementMods = this.modifications.get(elementId) || []
    elementMods.push(modification)
    this.modifications.set(elementId, elementMods)
  }

  /**
   * Generate CSS for all modifications
   */
  generateVariationCSS(): string {
    let css = ''
    
    this.modifications.forEach((modifications, elementId) => {
      const element = this.elements.get(elementId)
      if (!element) return

      modifications.forEach(mod => {
        if (mod.type === 'style' && mod.cssRule) {
          css += `${element.selector} { ${mod.cssRule} }\n`
        }
      })
    })

    return css
  }

  /**
   * Generate JavaScript for dynamic changes
   */
  generateVariationJS(): string {
    let js = 'function applyVariation() {\n'
    
    this.modifications.forEach((modifications, elementId) => {
      const element = this.elements.get(elementId)
      if (!element) return

      js += `  var element = document.querySelector('${element.selector}');\n`
      js += `  if (element) {\n`

      modifications.forEach(mod => {
        switch (mod.type) {
          case 'text_content':
            js += `    element.textContent = '${mod.newValue}';\n`
            break
          case 'html':
            js += `    element.innerHTML = '${mod.newValue}';\n`
            break
          case 'attribute':
            js += `    element.setAttribute('${mod.property}', '${mod.newValue}');\n`
            break
        }
      })

      js += `  }\n`
    })

    js += '}\n'
    js += 'if (document.readyState === "loading") {\n'
    js += '  document.addEventListener("DOMContentLoaded", applyVariation);\n'
    js += '} else {\n'
    js += '  applyVariation();\n'
    js += '}\n'

    return js
  }

  /**
   * Create test variation from current modifications
   */
  createVariation(name: string): TestVariation {
    const changes: VisualChange[] = []

    this.modifications.forEach((modifications, elementId) => {
      const element = this.elements.get(elementId)
      if (!element) return

      modifications.forEach(mod => {
        changes.push({
          elementId,
          selector: element.selector,
          type: this.mapModificationToChangeType(mod.type),
          before: mod.originalValue,
          after: mod.newValue,
          css: mod.cssRule,
          html: mod.type === 'html' ? mod.newValue : undefined,
          attributes: mod.type === 'attribute' ? { [mod.property]: mod.newValue } : undefined,
        })
      })
    })

    return {
      id: `variation_${Date.now()}`,
      name,
      changes,
      isControl: false,
      trafficPercentage: 50,
    }
  }

  // Helper methods
  private getElementType(element: HTMLElement): ElementType {
    const tagName = element.tagName.toLowerCase()
    
    if (tagName === 'button' || element.type === 'submit' || element.type === 'button') {
      return 'button'
    }
    if (tagName === 'a') return 'link'
    if (tagName === 'img') return 'image'
    if (tagName === 'form') return 'form'
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName)) {
      return 'text'
    }
    if (['div', 'section', 'article'].includes(tagName)) return 'container'
    
    return 'text' // Default
  }

  private getElementContent(element: HTMLElement): string {
    if (element.tagName.toLowerCase() === 'img') {
      return element.getAttribute('src') || ''
    }
    return element.textContent || element.innerHTML || ''
  }

  private isElementEditable(element: HTMLElement): boolean {
    // Check if element or parent has contenteditable
    if (element.contentEditable === 'true') return true
    
    // Check if it's a typical editable element
    const editableTags = ['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'img']
    return editableTags.includes(element.tagName.toLowerCase())
  }

  private getParentElementId(element: HTMLElement): string | undefined {
    const parent = element.parentElement
    if (!parent) return undefined

    // Find parent in elements map
    for (const [id, visualElement] of this.elements) {
      if (this.targetDocument?.querySelector(visualElement.selector) === parent) {
        return id
      }
    }
    return undefined
  }

  private mapModificationToChangeType(modType: ModificationType): ChangeType {
    const mapping: Record<ModificationType, ChangeType> = {
      text_content: 'text',
      style: 'style',
      attribute: 'content',
      html: 'content',
      remove: 'visibility',
      add: 'content',
      move: 'position',
      hide: 'visibility',
      show: 'visibility',
    }
    return mapping[modType] || 'content'
  }

  // Implementation stubs for remaining methods
  private injectEditorStyles(): void { /* Implementation */ }
  private setupEventListeners(): void { /* Implementation */ }
  private createEditingIframe(url: string): HTMLIFrameElement { 
    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.style.width = '100%'
    iframe.style.height = '100vh'
    return iframe
  }
  private waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      iframe.onload = () => resolve()
    })
  }
  private highlightElement(element: HTMLElement): void { /* Implementation */ }
  private removeHighlight(element: HTMLElement): void { /* Implementation */ }
  private highlightSelectedElement(element: VisualElement): void { /* Implementation */ }
  private setupToolbarListeners(): void { /* Implementation */ }
  private setupEditorPanelListeners(element: VisualElement): void { /* Implementation */ }
  private generateImageEditorHTML(element: VisualElement): string { return '' }
  private generateLinkEditorHTML(element: VisualElement): string { return '' }
  private generateGenericEditorHTML(element: VisualElement): string { return '' }
  private setupMutationObserver(): void { /* Implementation */ }
}

export default VisualEditor