declare module 'react-native-ios-context-menu' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface MenuItem {
    type: 'action' | 'destructive' | 'inline';
    actionKey: string;
    actionTitle: string;
    icon?: {
      type: 'SYSTEM' | 'ASSET' | 'IMAGE';
      systemName?: string;
      imageName?: string;
    };
  }

  export interface ContextMenuProps extends ViewProps {
    menuConfig: {
      menuTitle?: string;
      menuItems: MenuItem[];
    };
    onPressMenuItem?: (event: { nativeEvent: { actionKey: string } }) => void;
  }

  export const ContextMenuView: React.FC<ContextMenuProps>;
}
