import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Search,
  FolderPlus,
  Hash,
  Type,
  ToggleLeft,
  ToggleRight,
  Maximize2,
  Minimize2,
  Check,
  X
} from 'lucide-react';

interface TreeEditorProps {
  data: unknown;
  onChange: (updated: unknown) => void;
}

type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

function getValueType(val: unknown): ValueType {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'object') return 'object';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  return 'string';
}

interface NodeProps {
  nodeKey: string | number;
  value: unknown;
  path: (string | number)[];
  depth: number;
  searchQuery: string;
  onUpdate: (path: (string | number)[], newValue: unknown) => void;
  onDelete: (path: (string | number)[]) => void;
  onAddChild: (path: (string | number)[], key: string, value: unknown) => void;
  onDuplicate: (path: (string | number)[]) => void;
  isRoot?: boolean;
}

const TreeNode: React.FC<NodeProps> = ({
  nodeKey,
  value,
  path,
  depth,
  searchQuery,
  onUpdate,
  onDelete,
  onAddChild,
  onDuplicate,
  isRoot = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(depth < 2);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editedKey, setEditedKey] = useState(String(nodeKey));
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropType, setNewPropType] = useState<ValueType>('string');
  const [newPropValue, setNewPropValue] = useState<string>('');

  const type = getValueType(value);
  const isBranch = type === 'object' || type === 'array';
  const childEntries = isBranch && value !== null
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const keyMatch = String(nodeKey).toLowerCase().includes(q);
    if (keyMatch) return true;
    if (!isBranch) {
      return String(value).toLowerCase().includes(q);
    }
    const jsonStr = JSON.stringify(value).toLowerCase();
    return jsonStr.includes(q);
  }, [searchQuery, nodeKey, value, isBranch]);

  if (!matchesSearch) return null;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const rawVal = e.target.value;
    if (type === 'number') {
      const num = Number(rawVal);
      onUpdate(path, isNaN(num) ? 0 : num);
    } else {
      onUpdate(path, rawVal);
    }
  };

  const handleBooleanToggle = () => {
    onUpdate(path, !value);
  };

  const handleCreateProperty = () => {
    if (!newPropKey && type === 'object') return;
    let initialVal: unknown = '';
    if (newPropType === 'number') initialVal = Number(newPropValue) || 0;
    else if (newPropType === 'boolean') initialVal = newPropValue === 'true';
    else if (newPropType === 'null') initialVal = null;
    else if (newPropType === 'object') initialVal = {};
    else if (newPropType === 'array') initialVal = [];
    else initialVal = newPropValue;

    const targetKey = type === 'array' ? childEntries.length : newPropKey;
    onAddChild(path, String(targetKey), initialVal);
    setIsAddingProperty(false);
    setNewPropKey('');
    setNewPropValue('');
    setIsOpen(true);
  };

  const getTypeBadge = (t: ValueType) => {
    switch (t) {
      case 'number':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">num</span>;
      case 'boolean':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">bool</span>;
      case 'null':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">null</span>;
      case 'array':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">array[{childEntries.length}]</span>;
      case 'object':
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">obj({childEntries.length})</span>;
      default:
        return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">str</span>;
    }
  };

  return (
    <div className={`text-xs ${depth > 0 ? 'ml-3 sm:ml-5 border-l border-slate-800/80 pl-2' : ''}`}>
      <div className="flex flex-wrap items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-slate-900/60 group transition-colors">
        {isBranch ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-white rounded"
            aria-label={isOpen ? "Collapse branch" : "Expand branch"}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {!isRoot && (
          <span className="font-semibold text-slate-300 font-mono flex items-center gap-1">
            <span className="text-cyan-400">{nodeKey}</span>
            <span className="text-slate-600">:</span>
          </span>
        )}

        {getTypeBadge(type)}

        {type === 'string' && (
          <input
            type="text"
            value={String(value)}
            onChange={handleValueChange}
            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-mono focus:border-cyan-500 focus:outline-none flex-1 min-w-[140px] max-w-sm sm:max-w-md"
          />
        )}

        {type === 'number' && (
          <input
            type="number"
            step="any"
            value={value as number}
            onChange={handleValueChange}
            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-mono focus:border-cyan-500 focus:outline-none w-36"
          />
        )}

        {type === 'boolean' && (
          <button
            onClick={handleBooleanToggle}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
              value
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/70 text-rose-300 border border-rose-800'
            }`}
          >
            {value ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
            <span>{value ? 'TRUE' : 'FALSE'}</span>
          </button>
        )}

        {type === 'null' && (
          <span className="text-slate-500 italic">null</span>
        )}

        <div className="ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity">
          {isBranch && (
            <button
              onClick={() => setIsAddingProperty(true)}
              className="p-1 rounded text-cyan-400 hover:bg-slate-800"
              title="Add property or element"
              aria-label="Add property"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {!isRoot && (
            <>
              <button
                onClick={() => onDuplicate(path)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                title="Duplicate node"
                aria-label="Duplicate node"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(path)}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                title="Delete node"
                aria-label="Delete node"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {isAddingProperty && (
        <div className="my-2 p-2.5 rounded-lg bg-slate-900 border border-cyan-800/80 space-y-2 max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span>Add New {type === 'array' ? 'Element' : 'Key'}</span>
            <button onClick={() => setIsAddingProperty(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {type !== 'array' && (
              <input
                type="text"
                placeholder="Property Key"
                value={newPropKey}
                onChange={(e) => setNewPropKey(e.target.value)}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
              />
            )}
            <select
              value={newPropType}
              onChange={(e) => setNewPropType(e.target.value as ValueType)}
              className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
              <option value="null">Null</option>
            </select>
          </div>

          {(newPropType === 'string' || newPropType === 'number') && (
            <input
              type={newPropType === 'number' ? 'number' : 'text'}
              placeholder="Initial Value"
              value={newPropValue}
              onChange={(e) => setNewPropValue(e.target.value)}
              className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none"
            />
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingProperty(false)}
              className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProperty}
              className="px-3 py-1 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {isBranch && isOpen && (
        <div className="space-y-0.5">
          {childEntries.map(([childKey, childValue]) => (
            <TreeNode
              key={childKey}
              nodeKey={childKey}
              value={childValue}
              path={[...path, type === 'array' ? Number(childKey) : childKey]}
              depth={depth + 1}
              searchQuery={searchQuery}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onDuplicate={onDuplicate}
            />
          ))}
          {childEntries.length === 0 && (
            <div className="py-1 px-3 text-slate-500 italic text-[11px]">
              Empty {type}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TreeEditor: React.FC<TreeEditorProps> = ({ data, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdate = (path: (string | number)[], newValue: unknown) => {
    if (path.length === 0) {
      onChange(newValue);
      return;
    }
    const cloned = JSON.parse(JSON.stringify(data));
    let cursor: any = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      cursor = cursor[path[i]];
    }
    cursor[path[path.length - 1]] = newValue;
    onChange(cloned);
  };

  const handleDelete = (path: (string | number)[]) => {
    if (path.length === 0) return;
    const cloned = JSON.parse(JSON.stringify(data));
    let cursor: any = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      cursor = cursor[path[i]];
    }
    const targetKey = path[path.length - 1];
    if (Array.isArray(cursor)) {
      cursor.splice(Number(targetKey), 1);
    } else {
      delete cursor[targetKey];
    }
    onChange(cloned);
  };

  const handleAddChild = (path: (string | number)[], key: string, value: unknown) => {
    const cloned = JSON.parse(JSON.stringify(data));
    let cursor: any = cloned;
    for (let i = 0; i < path.length; i++) {
      cursor = cursor[path[i]];
    }
    if (Array.isArray(cursor)) {
      cursor.push(value);
    } else if (typeof cursor === 'object' && cursor !== null) {
      cursor[key] = value;
    }
    onChange(cloned);
  };

  const handleDuplicate = (path: (string | number)[]) => {
    if (path.length === 0) return;
    const cloned = JSON.parse(JSON.stringify(data));
    let cursor: any = cloned;
    for (let i = 0; i < path.length - 1; i++) {
      cursor = cursor[path[i]];
    }
    const targetKey = path[path.length - 1];
    const valueToDuplicate = JSON.parse(JSON.stringify(cursor[targetKey]));

    if (Array.isArray(cursor)) {
      cursor.splice(Number(targetKey) + 1, 0, valueToDuplicate);
    } else {
      let duplicateKey = `${targetKey}_copy`;
      let counter = 1;
      while (cursor[duplicateKey] !== undefined) {
        duplicateKey = `${targetKey}_copy${counter++}`;
      }
      cursor[duplicateKey] = valueToDuplicate;
    }
    onChange(cloned);
  };

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-full shadow-inner">
      <div className="border-b border-slate-800 p-3 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keys, values, or paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Clear Search
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400">
            Type-Enforced Visual Inspector
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 max-h-[600px]">
        {data !== undefined && data !== null ? (
          <TreeNode
            nodeKey="root"
            value={data}
            path={[]}
            depth={0}
            searchQuery={searchQuery}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onDuplicate={handleDuplicate}
            isRoot={true}
          />
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No structured data loaded in editor
          </div>
        )}
      </div>
    </div>
  );
};
