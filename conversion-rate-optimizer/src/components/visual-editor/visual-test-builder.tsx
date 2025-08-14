'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ChevronDownIcon, PlusIcon, TrashIcon, EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

interface ElementChange {
  id: string;
  selector: string;
  property: string;
  value: string;
  changeType: 'text' | 'style' | 'attribute' | 'html';
  originalValue?: string;
}

interface TestVariation {
  id: string;
  name: string;
  description: string;
  changes: ElementChange[];
  isControl: boolean;
}

interface VisualTestBuilderProps {
  targetUrl: string;
  onSave: (variations: TestVariation[]) => void;
  onPreview: (variationId: string) => void;
  initialVariations?: TestVariation[];
}

export const VisualTestBuilder: React.FC<VisualTestBuilderProps> = ({
  targetUrl,
  onSave,
  onPreview,
  initialVariations = []
}) => {
  const [variations, setVariations] = useState<TestVariation[]>(initialVariations);
  const [activeVariation, setActiveVariation] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [showElementSelector, setShowElementSelector] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (variations.length === 0) {
      // Initialize with control variation
      setVariations([
        {
          id: 'control',
          name: 'Control (Original)',
          description: 'Original version without changes',
          changes: [],
          isControl: true
        }
      ]);
      setActiveVariation('control');
    }
  }, []);

  const addVariation = () => {
    const newVariation: TestVariation = {
      id: `variation-${Date.now()}`,
      name: `Variation ${variations.length}`,
      description: 'New test variation',
      changes: [],
      isControl: false
    };
    setVariations([...variations, newVariation]);
    setActiveVariation(newVariation.id);
  };

  const updateVariation = (id: string, updates: Partial<TestVariation>) => {
    setVariations(variations.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const deleteVariation = (id: string) => {
    if (variations.length > 1) {
      const newVariations = variations.filter(v => v.id !== id);
      setVariations(newVariations);
      if (activeVariation === id) {
        setActiveVariation(newVariations[0].id);
      }
    }
  };

  const addElementChange = (change: Omit<ElementChange, 'id'>) => {
    if (!activeVariation) return;

    const newChange: ElementChange = {
      id: `change-${Date.now()}`,
      ...change
    };

    setVariations(variations.map(v => 
      v.id === activeVariation 
        ? { ...v, changes: [...v.changes, newChange] }
        : v
    ));
  };

  const updateElementChange = (changeId: string, updates: Partial<ElementChange>) => {
    setVariations(variations.map(v => 
      v.id === activeVariation 
        ? {
            ...v,
            changes: v.changes.map(c => 
              c.id === changeId ? { ...c, ...updates } : c
            )
          }
        : v
    ));
  };

  const removeElementChange = (changeId: string) => {
    setVariations(variations.map(v => 
      v.id === activeVariation 
        ? { ...v, changes: v.changes.filter(c => c.id !== changeId) }
        : v
    ));
  };

  const handleElementSelection = (selector: string) => {
    setShowElementSelector(false);
    // Add logic to highlight selected element in iframe
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'highlight-element',
        selector
      }, '*');
    }
  };

  const applyChangesToIframe = (variationId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'apply-changes',
        changes: variation.changes
      }, '*');
    }
  };

  const activeVar = variations.find(v => v.id === activeVariation);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Variations & Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Visual Test Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage test variations</p>
        </div>

        {/* Variations List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Variations</h3>
              <button
                onClick={addVariation}
                className="inline-flex items-center p-1 border border-transparent rounded text-primary-600 hover:bg-primary-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${activeVariation === variation.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setActiveVariation(variation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {variation.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {variation.changes.length} changes
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(variation.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Preview"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {!variation.isControl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVariation(variation.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Variation Editor */}
          {activeVar && (
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Edit {activeVar.name}
              </h3>

              {/* Variation Settings */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={activeVar.name}
                    onChange={(e) => updateVariation(activeVar.id, { name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={activeVar.description}
                    onChange={(e) => updateVariation(activeVar.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Element Changes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Element Changes</h4>
                  <button
                    onClick={() => setShowElementSelector(true)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Add Change
                  </button>
                </div>

                <div className="space-y-2">
                  {activeVar.changes.map((change) => (
                    <ElementChangeEditor
                      key={change.id}
                      change={change}
                      onUpdate={(updates) => updateElementChange(change.id, updates)}
                      onRemove={() => removeElementChange(change.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => onSave(variations)}
              className="flex-1 bg-primary-600 text-white text-sm py-2 px-3 rounded hover:bg-primary-700"
            >
              Save Test
            </button>
            <button
              onClick={() => applyChangesToIframe(activeVariation)}
              className="px-3 py-2 border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Website Preview */}
      <div className="flex-1 flex flex-col">
        {/* Preview Controls */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Preview:</label>
                <select
                  value={previewMode}
                  onChange={(e) => setPreviewMode(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                URL: {targetUrl}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowElementSelector(!showElementSelector)}
                className={`
                  inline-flex items-center px-3 py-1 text-sm rounded
                  ${showElementSelector 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <CodeBracketIcon className="h-4 w-4 mr-1" />
                Element Selector
              </button>
            </div>
          </div>
        </div>

        {/* Website Preview */}
        <div className="flex-1 bg-gray-100 p-4">
          <div className={`
            mx-auto bg-white rounded-lg shadow-lg overflow-hidden
            ${previewMode === 'desktop' ? 'max-w-full' : ''}
            ${previewMode === 'tablet' ? 'max-w-2xl' : ''}
            ${previewMode === 'mobile' ? 'max-w-sm' : ''}
          `}>
            <iframe
              ref={iframeRef}
              src={targetUrl}
              className="w-full h-full min-h-[800px] border-0"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => {
                // Initialize element selection if enabled
                if (showElementSelector) {
                  const iframe = iframeRef.current;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                      type: 'enable-element-selection'
                    }, '*');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Element Selector Modal */}
      {showElementSelector && (
        <ElementSelectorModal
          onSelect={handleElementSelection}
          onClose={() => setShowElementSelector(false)}
          onAddChange={addElementChange}
        />
      )}
    </div>
  );
};

interface ElementChangeEditorProps {
  change: ElementChange;
  onUpdate: (updates: Partial<ElementChange>) => void;
  onRemove: () => void;
}

const ElementChangeEditor: React.FC<ElementChangeEditorProps> = ({
  change,
  onUpdate,
  onRemove
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="p-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-900">
              {change.selector}
            </div>
            <div className="text-xs text-gray-500">
              {change.property}: {change.value}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
            <ChevronDownIcon 
              className={`h-3 w-3 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              CSS Selector
            </label>
            <input
              type="text"
              value={change.selector}
              onChange={(e) => onUpdate({ selector: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="e.g., .button, #header, h1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Property
              </label>
              <select
                value={change.property}
                onChange={(e) => onUpdate({ property: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="text">Text Content</option>
                <option value="innerHTML">HTML Content</option>
                <option value="backgroundColor">Background Color</option>
                <option value="color">Text Color</option>
                <option value="fontSize">Font Size</option>
                <option value="display">Display</option>
                <option value="href">Link URL</option>
                <option value="src">Image Source</option>
                <option value="alt">Alt Text</option>
                <option value="class">CSS Class</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={change.changeType}
                onChange={(e) => onUpdate({ changeType: e.target.value as any })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="text">Text</option>
                <option value="style">Style</option>
                <option value="attribute">Attribute</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              New Value
            </label>
            {change.changeType === 'html' ? (
              <textarea
                value={change.value}
                onChange={(e) => onUpdate({ value: e.target.value })}
                rows={3}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                placeholder="Enter HTML content"
              />
            ) : (
              <input
                type="text"
                value={change.value}
                onChange={(e) => onUpdate({ value: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="Enter new value"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ElementSelectorModalProps {
  onSelect: (selector: string) => void;
  onClose: () => void;
  onAddChange: (change: Omit<ElementChange, 'id'>) => void;
}

const ElementSelectorModal: React.FC<ElementSelectorModalProps> = ({
  onSelect,
  onClose,
  onAddChange
}) => {
  const [selector, setSelector] = useState('');
  const [property, setProperty] = useState('text');
  const [value, setValue] = useState('');
  const [changeType, setChangeType] = useState<ElementChange['changeType']>('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selector && property && value) {
      onAddChange({
        selector,
        property,
        value,
        changeType
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Element Change
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSS Selector
            </label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., .button, #header, h1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Click on elements in the preview to auto-fill this field
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="text">Text Content</option>
                <option value="innerHTML">HTML Content</option>
                <option value="backgroundColor">Background Color</option>
                <option value="color">Text Color</option>
                <option value="fontSize">Font Size</option>
                <option value="display">Display</option>
                <option value="href">Link URL</option>
                <option value="src">Image Source</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="text">Text</option>
                <option value="style">Style</option>
                <option value="attribute">Attribute</option>
                <option value="html">HTML</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter new value"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Add Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisualTestBuilder;