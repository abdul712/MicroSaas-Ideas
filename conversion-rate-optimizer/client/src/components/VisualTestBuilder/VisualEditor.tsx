'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  CodeBracketIcon,
  SwatchIcon,
  PhotoIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

export interface ElementChange {
  id: string;
  selector: string;
  property: string;
  oldValue: string;
  newValue: string;
  changeType: 'text' | 'color' | 'size' | 'position' | 'visibility' | 'structure';
}

export interface TestVariation {
  id: string;
  name: string;
  description: string;
  changes: ElementChange[];
  trafficPercentage: number;
  isControl: boolean;
}

interface VisualEditorProps {
  targetUrl: string;
  variations: TestVariation[];
  onVariationsChange: (variations: TestVariation[]) => void;
  onPreview: (variationId: string) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  targetUrl,
  variations,
  onVariationsChange,
  onPreview
}) => {
  const [selectedVariation, setSelectedVariation] = useState<string>(variations[0]?.id || '');
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [elementProperties, setElementProperties] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize iframe and element inspection
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Inject inspection script
            injectInspectionScript(iframeDoc);
            // Apply current variation changes
            applyVariationChanges(iframeDoc, selectedVariation);
          }
        } catch (error) {
          console.error('Error accessing iframe content:', error);
        }
      };
    }
  }, [targetUrl, selectedVariation]);

  const injectInspectionScript = (doc: Document) => {
    const script = doc.createElement('script');
    script.textContent = `
      (function() {
        let isInspecting = false;
        let highlightedElement = null;
        
        function createHighlight() {
          const highlight = document.createElement('div');
          highlight.id = 'cro-element-highlight';
          highlight.style.cssText = \`
            position: absolute;
            border: 2px solid #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            pointer-events: none;
            z-index: 10000;
            border-radius: 4px;
          \`;
          document.body.appendChild(highlight);
          return highlight;
        }
        
        function getElementSelector(element) {
          if (element.id) return '#' + element.id;
          
          let selector = element.tagName.toLowerCase();
          
          if (element.className) {
            const classes = element.className.split(' ').filter(c => c).slice(0, 2);
            selector += '.' + classes.join('.');
          }
          
          // Add position if needed for uniqueness
          const siblings = Array.from(element.parentNode?.children || [])
            .filter(el => el.tagName === element.tagName);
          if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += \`:nth-child(\${index})\`;
          }
          
          return selector;
        }
        
        function highlightElement(element) {
          const highlight = document.getElementById('cro-element-highlight') || createHighlight();
          const rect = element.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          highlight.style.top = (rect.top + scrollTop) + 'px';
          highlight.style.left = (rect.left + scrollLeft) + 'px';
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          highlight.style.display = 'block';
        }
        
        function hideHighlight() {
          const highlight = document.getElementById('cro-element-highlight');
          if (highlight) highlight.style.display = 'none';
        }
        
        document.addEventListener('mouseover', function(e) {
          if (!isInspecting) return;
          e.preventDefault();
          e.stopPropagation();
          highlightElement(e.target);
        });
        
        document.addEventListener('mouseout', function(e) {
          if (!isInspecting) return;
          hideHighlight();
        });
        
        document.addEventListener('click', function(e) {
          if (!isInspecting) return;
          e.preventDefault();
          e.stopPropagation();
          
          const selector = getElementSelector(e.target);
          const computedStyle = window.getComputedStyle(e.target);
          
          // Send element data to parent
          window.parent.postMessage({
            type: 'elementSelected',
            selector: selector,
            properties: {
              text: e.target.textContent || e.target.innerText || '',
              color: computedStyle.color,
              backgroundColor: computedStyle.backgroundColor,
              fontSize: computedStyle.fontSize,
              fontFamily: computedStyle.fontFamily,
              display: computedStyle.display,
              position: computedStyle.position,
              width: computedStyle.width,
              height: computedStyle.height,
              margin: computedStyle.margin,
              padding: computedStyle.padding
            }
          }, '*');
          
          hideHighlight();
        });
        
        // Listen for inspection mode changes
        window.addEventListener('message', function(e) {
          if (e.data.type === 'setInspectionMode') {
            isInspecting = e.data.enabled;
            if (!isInspecting) hideHighlight();
          }
        });
      })();
    `;
    doc.head.appendChild(script);
  };

  const applyVariationChanges = (doc: Document, variationId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    // Remove existing CRO styles
    const existingStyles = doc.querySelectorAll('style[data-cro="true"]');
    existingStyles.forEach(style => style.remove());

    // Apply changes
    variation.changes.forEach(change => {
      try {
        const elements = doc.querySelectorAll(change.selector);
        elements.forEach(element => {
          applyElementChange(element as HTMLElement, change);
        });
      } catch (error) {
        console.error('Error applying change:', error);
      }
    });
  };

  const applyElementChange = (element: HTMLElement, change: ElementChange) => {
    switch (change.changeType) {
      case 'text':
        if (element.textContent !== undefined) {
          element.textContent = change.newValue;
        }
        break;
      case 'color':
        element.style.color = change.newValue;
        break;
      case 'size':
        if (change.property === 'fontSize') {
          element.style.fontSize = change.newValue;
        } else if (change.property === 'width') {
          element.style.width = change.newValue;
        } else if (change.property === 'height') {
          element.style.height = change.newValue;
        }
        break;
      case 'position':
        element.style[change.property as any] = change.newValue;
        break;
      case 'visibility':
        element.style.display = change.newValue;
        break;
    }
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected') {
        setSelectedElement(event.data.selector);
        setElementProperties(event.data.properties);
        setIsInspecting(false);
        
        // Update iframe to stop inspection
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'setInspectionMode',
            enabled: false
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleInspection = () => {
    const newInspecting = !isInspecting;
    setIsInspecting(newInspecting);
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'setInspectionMode',
        enabled: newInspecting
      }, '*');
    }
  };

  const addVariation = () => {
    const newVariation: TestVariation = {
      id: `var_${Date.now()}`,
      name: `Variation ${variations.length}`,
      description: '',
      changes: [],
      trafficPercentage: 50,
      isControl: false
    };
    
    onVariationsChange([...variations, newVariation]);
    setSelectedVariation(newVariation.id);
  };

  const updateVariation = (variationId: string, updates: Partial<TestVariation>) => {
    const updatedVariations = variations.map(v => 
      v.id === variationId ? { ...v, ...updates } : v
    );
    onVariationsChange(updatedVariations);
  };

  const addChange = (changeType: ElementChange['changeType']) => {
    if (!selectedElement || !selectedVariation) return;

    const newChange: ElementChange = {
      id: `change_${Date.now()}`,
      selector: selectedElement,
      property: getDefaultProperty(changeType),
      oldValue: getElementProperty(changeType),
      newValue: getElementProperty(changeType),
      changeType
    };

    const variation = variations.find(v => v.id === selectedVariation);
    if (variation) {
      updateVariation(selectedVariation, {
        changes: [...variation.changes, newChange]
      });
    }
  };

  const updateChange = (changeId: string, updates: Partial<ElementChange>) => {
    const variation = variations.find(v => v.id === selectedVariation);
    if (!variation) return;

    const updatedChanges = variation.changes.map(c =>
      c.id === changeId ? { ...c, ...updates } : c
    );
    
    updateVariation(selectedVariation, { changes: updatedChanges });
    
    // Re-apply changes to iframe
    if (iframeRef.current?.contentDocument) {
      applyVariationChanges(iframeRef.current.contentDocument, selectedVariation);
    }
  };

  const removeChange = (changeId: string) => {
    const variation = variations.find(v => v.id === selectedVariation);
    if (!variation) return;

    const updatedChanges = variation.changes.filter(c => c.id !== changeId);
    updateVariation(selectedVariation, { changes: updatedChanges });
  };

  const getDefaultProperty = (changeType: ElementChange['changeType']): string => {
    switch (changeType) {
      case 'text': return 'textContent';
      case 'color': return 'color';
      case 'size': return 'fontSize';
      case 'position': return 'top';
      case 'visibility': return 'display';
      default: return 'property';
    }
  };

  const getElementProperty = (changeType: ElementChange['changeType']): string => {
    if (!elementProperties) return '';
    
    switch (changeType) {
      case 'text': return elementProperties.text || '';
      case 'color': return elementProperties.color || '#000000';
      case 'size': return elementProperties.fontSize || '16px';
      case 'position': return '0px';
      case 'visibility': return elementProperties.display || 'block';
      default: return '';
    }
  };

  const currentVariation = variations.find(v => v.id === selectedVariation);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Panel - Variations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Test Variations</h3>
            <button
              onClick={addVariation}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {variations.map(variation => (
              <div
                key={variation.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedVariation === variation.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedVariation(variation.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">
                    {variation.name}
                  </span>
                  {variation.isControl && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Control
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {variation.changes.length} changes • {variation.trafficPercentage}% traffic
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Element Inspector */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Element Inspector</h4>
          
          <button
            onClick={toggleInspection}
            className={`w-full inline-flex items-center justify-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
              isInspecting
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <CursorArrowRaysIcon className="h-4 w-4 mr-2" />
            {isInspecting ? 'Stop Inspecting' : 'Inspect Element'}
          </button>

          {selectedElement && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <span className="font-medium">Selected:</span>
              <div className="text-gray-600 mt-1 break-all">{selectedElement}</div>
            </div>
          )}
        </div>

        {/* Modification Tools */}
        <div className="flex-1 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Modifications</h4>
          
          {selectedElement ? (
            <div className="space-y-2">
              <button
                onClick={() => addChange('text')}
                className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CodeBracketIcon className="h-4 w-4 mr-2" />
                Edit Text
              </button>
              
              <button
                onClick={() => addChange('color')}
                className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <SwatchIcon className="h-4 w-4 mr-2" />
                Change Color
              </button>
              
              <button
                onClick={() => addChange('size')}
                className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PhotoIcon className="h-4 w-4 mr-2" />
                Resize Element
              </button>
              
              <button
                onClick={() => addChange('visibility')}
                className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Show/Hide
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an element to start modifying</p>
          )}
        </div>
      </div>

      {/* Center Panel - Preview */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Preview: {currentVariation?.name}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => currentVariation && onPreview(currentVariation.id)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Full Preview
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-100">
          <iframe
            ref={iframeRef}
            src={targetUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title="Test Preview"
          />
        </div>
      </div>

      {/* Right Panel - Changes */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Changes</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {currentVariation?.changes.length ? (
            <div className="p-4 space-y-3">
              {currentVariation.changes.map(change => (
                <ChangeEditor
                  key={change.id}
                  change={change}
                  onUpdate={(updates) => updateChange(change.id, updates)}
                  onRemove={() => removeChange(change.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No changes yet. Start by selecting an element and adding modifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Change Editor Component
interface ChangeEditorProps {
  change: ElementChange;
  onUpdate: (updates: Partial<ElementChange>) => void;
  onRemove: () => void;
}

const ChangeEditor: React.FC<ChangeEditorProps> = ({ change, onUpdate, onRemove }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 capitalize">
          {change.changeType} Change
        </span>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      
      <div className="text-xs text-gray-600 mb-2 break-all">
        {change.selector}
      </div>
      
      <div className="space-y-2">
        {change.changeType === 'text' && (
          <textarea
            value={change.newValue}
            onChange={(e) => onUpdate({ newValue: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            rows={2}
            placeholder="New text content"
          />
        )}
        
        {change.changeType === 'color' && (
          <input
            type="color"
            value={change.newValue}
            onChange={(e) => onUpdate({ newValue: e.target.value })}
            className="w-full h-8 border border-gray-300 rounded"
          />
        )}
        
        {change.changeType === 'size' && (
          <div className="flex space-x-2">
            <select
              value={change.property}
              onChange={(e) => onUpdate({ property: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="fontSize">Font Size</option>
              <option value="width">Width</option>
              <option value="height">Height</option>
            </select>
            <input
              type="text"
              value={change.newValue}
              onChange={(e) => onUpdate({ newValue: e.target.value })}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              placeholder="e.g., 16px, 100%, auto"
            />
          </div>
        )}
        
        {change.changeType === 'visibility' && (
          <select
            value={change.newValue}
            onChange={(e) => onUpdate({ newValue: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="block">Show</option>
            <option value="none">Hide</option>
            <option value="inline">Inline</option>
            <option value="flex">Flex</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default VisualEditor;