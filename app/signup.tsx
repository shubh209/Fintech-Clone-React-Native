import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { defaultStyles } from '@/constants/Styles'
import Colors from '@/constants/Colors'
import { useSignUp } from '@clerk/clerk-expo'

const signup = () => {

    const [countryCode, setCountryCode] = useState('+1');
    const [phoneNumber, setPhonenNumber] = useState('');
    const router = useRouter();
    const { signUp } = useSignUp();

    const onSignUp = async() => {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`

        try {
            await signUp!.create({
                phoneNumber: fullPhoneNumber
            });
            await signUp!.preparePhoneNumberVerification({strategy: 'phone_code'});
            router.push({pathname: "./verify/[phone]", params: {phone: fullPhoneNumber}});
        } catch (error) {
            console.error('Error creating user', error);
        }
    };

    return (

        <KeyboardAvoidingView
            style={{flex: 1}}
            behavior='padding'
            keyboardVerticalOffset={80}
        >
            <View style={defaultStyles.container}>

                {/* header view */}
                <Text style={defaultStyles.header}>Let's get started!</Text>
                <Text style={defaultStyles.descriptionText}>
                    Enter your phone number. We will send you a verification code.
                </Text>
                
                {/* verification. code input */}
                <View style={styles.inputContainer}> 
                    {/* country code */}\
                    <TextInput 
                        style={styles.Input}
                        placeholder="Country Code"
                        placeholderTextColor={Colors.gray}
                        value={countryCode}
                    
                    />
                    {/* your number */}
                    <TextInput
                        style={[styles.Input, {flex: 1}]}
                        placeholder='Phone Number'
                        placeholderTextColor={Colors.gray}
                        keyboardType='phone-pad'
                        value={phoneNumber}
                        onChangeText={setPhonenNumber}
                    />
                </View>

                <Link 
                    href={'/login'} 
                    replace
                    asChild>
                    <TouchableOpacity>
                        <Text style={defaultStyles.textLink}>Already have an Account? Log in</Text>
                    </TouchableOpacity>    
                </Link>

                <View style={{flex: 1}}> </View>

                {/* signup button */}
                <TouchableOpacity
                    style={[
                        defaultStyles.pillButton, 
                        phoneNumber !== '' ? styles.enabled : styles.disabled,
                        {marginBottom: 20},

                    ]}
                    onPress={onSignUp}
                >
                    <Text>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
        
  )
}

export default signup

const styles = StyleSheet.create({
    inputContainer:{
        marginVertical: 40,
        flexDirection: 'row',
    },
    Input:{
        backgroundColor: Colors.lightGray,
        padding: 20,
        borderRadius: 15,
        fontSize: 20,
        marginRight: 10,

    },
    enabled:{
        backgroundColor: Colors.primary,
    },
    disabled: {
        backgroundColor: Colors.primaryMuted,
    }
})