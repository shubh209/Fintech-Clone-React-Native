import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/shared/theme/colors';

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

                <View style={styles.roundBtn}>
                    <Text style={styles.initials}>SK</Text>
                </View>

                <View style={styles.titleBlock}>
                    <Text style={styles.eyebrow}>Crypto simulator</Text>
                    <Text style={styles.title}>Market watch</Text>
                </View>
            </View>
        </BlurView>
    )
}

const styles = StyleSheet.create({
    container:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 54,
        backgroundColor: 'transparent',
    },
    roundBtn:{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    titleBlock: {
        flex: 1,
        gap: 2,
    },
    eyebrow: {
        color: Colors.gray,
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: Colors.dark,
        fontSize: 18,
        fontWeight: '800',
    },
});


export default CustomHeader;
