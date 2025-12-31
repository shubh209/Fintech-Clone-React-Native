import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';

const CustomHeader = () => {
    const { top } = useSafeAreaInsets();

    return (
        <BlurView
            intensity={80}
            tint='extraLight'
            style={{
                padding: top,
            }}
        >
            <View style={styles.container} >

                {/* account logo */}
                <TouchableOpacity style={styles.RoundBtn}>
                    <Text style={{color: 'white', fontWeight: '500', fontSize: 16}}>SK</Text>
                </TouchableOpacity>
                
                {/* search option */}
                <View style={styles.searchSection}>
                    <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
                    <TextInput 
                        style={styles.input}
                        placeholder='Search'
                        placeholderTextColor={Colors.dark}
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
        height: 60,
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
    },
    RoundBtn:{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSection:{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.lightGray,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    searchIcon:{
        padding: 20,

    },
    input:{
        flex: 1,
        padding: 10,
        color: Colors.dark,
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
});


export default CustomHeader;
