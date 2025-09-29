import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import CustomHeader from '@/Components/CustomHeader';

const Layout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarActiveTintColor: Colors.primary,
            tabBarBackground: () => (
                <BlurView 
                    intensity={50}
                    tint='extraLight'
                    style={{
                        flex:1,
                        backgroundColor: 'rgba(0,0,0,0.05)'
                    }}
                />
            ),
            tabBarStyle: {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                elevation: 0,
            }
        }}
    >
        <Tabs.Screen 
            name="home"
            options={{
                title: 'Home',
                tabBarIcon: ({color, size}) => (
                    <FontAwesome name="registered" size={size} color={color} />
                ),
                header: () => <CustomHeader />,
                headerTransparent: true, 
            }}
        />

        <Tabs.Screen 
            name="invest"
            options={{
                title: 'Invest',
                tabBarIcon: ({color, size}) => (
                    <FontAwesome name="line-chart" size={size} color={color} />
                ),
            }}
        />

        <Tabs.Screen 
            name="transfer"
            options={{
                title: 'Transfers',
                tabBarIcon: ({color, size}) => (
                    <FontAwesome name="exchange" size={size} color={color} />
                ),
            }}
        />

        <Tabs.Screen 
            name="crypto"
            options={{
                title: 'Crypto',
                tabBarIcon: ({color, size}) => (
                    <FontAwesome name="bitcoin" size={size} color={color} />
                ),
                header: () => <CustomHeader />,
                headerTransparent: true, 
            }}
        />

        <Tabs.Screen 
            name="lifestyle"
            options={{
                title: 'Lifestyle',
                tabBarIcon: ({color, size}) => (
                    <FontAwesome name="th" size={size} color={color} />
                ),
            }}
        />
        
    </Tabs>
  )
}

export default Layout;

const styles = StyleSheet.create({});