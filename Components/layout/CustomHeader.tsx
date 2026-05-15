import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const CustomHeader = () => {
    const { top } = useSafeAreaInsets();

    return (
        <BlurView
            intensity={80}
            tint='extraLight'
            style={{
                paddingTop: top + 10,
                paddingHorizontal: 20,
                paddingBottom: 12,
            }}
        >
            <View style={styles.container} >

                {/* account logo */}
                <TouchableOpacity style={styles.RoundBtn}>
                    <Text style={{color: 'white', fontWeight: '500', fontSize: 16}}>SK</Text>
                </TouchableOpacity>
                
                {/* search option */}
                <View style={styles.searchSection}>
                    <Ionicons name="search" size={20} color={Colors.gray} />
                    <TextInput 
                        style={styles.input}
                        placeholder='Search'
                        placeholderTextColor={Colors.gray}
                    />
                </View>

                {/* icons */}
                <View style={styles.circle}>
                    <Ionicons name="stats-chart" size={30} color={Colors.dark} />
                </View>
                <View style={styles.circle}>
                    <Ionicons name="card" size={30} color={Colors.dark} />
                </View>
                
            </View>
        </BlurView>
    )
}

const styles = StyleSheet.create({
    container:{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        minHeight: 54,
        backgroundColor: 'transparent',
    },
    RoundBtn:{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection:{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.lightGray,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        minWidth: 120,
        height: 48,
        paddingHorizontal: 16,
        gap: 8,
    },
    input:{
        flex: 1,
        height: 48,
        padding: 0,
        color: Colors.dark,
        fontSize: 16,
    },
    circle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
});


export default CustomHeader;
