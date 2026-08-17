/**
 * Tab Panel - Manage different side panels with tabs
 */

import { useState } from 'react';
import { PropertiesPanel } from './PropertiesPanel';
import { HistoryPanel } from './HistoryPanel';
import { ShapeInfoPanel } from './ShapeInfoPanel';
import './TabPanel.css';

type TabType = 'properties' | 'history' | 'info';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'properties', label: 'Properties', icon: '🎨' },
  { id: 'info', label: 'Info', icon: 'ℹ️' },
  { id: 'history', label: 'History', icon: '📋' },
];

export const TabPanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>('properties');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'properties':
        return <PropertiesPanel />;
      case 'history':
        return <HistoryPanel />;
      case 'info':
        return <ShapeInfoPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="tab-panel">
      <div className="tab-buttons">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};
