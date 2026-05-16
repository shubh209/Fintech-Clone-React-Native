import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import CustomHeader from '@/Components/layout/CustomHeader';

const Layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint={'extraLight'}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.05)',
            }}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="registered" size={size} color={color} />
          ),
          header: () => <CustomHeader />,
          headerTransparent: true,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ size, color }) => (
            <FontAwesome name="list-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crypto"
        options={{
          title: 'Crypto',
          tabBarIcon: ({ size, color }) => <FontAwesome name="bitcoin" size={size} color={color} />,
          header: () => <CustomHeader />,
          headerTransparent: true,
        }}
      />
    </Tabs>
  );
};
export default Layout;
