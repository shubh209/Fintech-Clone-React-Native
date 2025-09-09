import { Alert, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { defaultStyles } from '@/constants/Styles'
import Colors from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { isClerkAPIResponseError, useSignIn } from '@clerk/clerk-expo'


// just an easier way to manage different sign in types
// instead of creating different functions for each type
// we can just use a single function and pass the type as a parameter
// this will make it easier to manage and scale in the future
// if we want to add more sign in types
// we just need to add them to the enum and handle them in the function
// rather than creating a new function for each type
enum SignInType{
  Phone,
  Email, 
  Google, 
  Apple
}

const Login = () => {

    const [countryCode, setCountryCode] = useState("+1");
    const [phoneNumber, setPhoneNumber] = useState('');
    const router = useRouter();
    const { signIn } = useSignIn();

    const onlogin = async(type: SignInType) => {

      // This block initiates phone number sign-in by:
      // 1. Combining country code and phone number into a full phone number.
      // 2. Creating a sign-in attempt with Clerk using the full phone number as the identifier.
      // 3. Finding the supported first factor with the 'phone_code' strategy (for SMS verification).
      // 4. Preparing the first factor to trigger sending a verification code to the user's phone.
      if(type === SignInType.Phone){
        try {
          const fullPhoneNumber = `${countryCode}${phoneNumber}`;

          const { supportedFirstFactors } = await signIn!.create({
            identifier: fullPhoneNumber,
          });

          const firstPhoneFactor: any = supportedFirstFactors
            ? supportedFirstFactors.find((factor: any) => {
                return factor.strategy === 'phone_code';
              })
            : null;

          const { phoneNumberId } = firstPhoneFactor;

          await signIn!.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId
          });

          router.push({ pathname: "/verify/[phone]", params: { phone: fullPhoneNumber, signin: "true" }});
        } 
        catch (err) {
          console.log('error', JSON.stringify(err, null, 2));
          if (isClerkAPIResponseError(err)) {
            if(err.errors[0].code === 'identifier_not_found'){
              Alert.alert('Error', err.errors[0].message );
            }
          }
        }
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
                <Text style={defaultStyles.header}>Welcome Back</Text>
                <Text style={defaultStyles.descriptionText}>
                    Enter the phone number associated with your account.
                </Text>
                
                {/* verification. code input */}
                <View style={styles.inputContainer}> 
                    {/* country code */}
                    <TextInput 
                        style={styles.Input}
                        placeholder="Country Code"
                        placeholderTextColor={Colors.gray}
                        value={countryCode}
                        onChangeText={setCountryCode}
                    
                    />
                    {/* your number */}
                    <TextInput
                        style={[styles.Input, {flex: 1}]}
                        placeholder='Phone Number'
                        placeholderTextColor={Colors.gray}
                        keyboardType='phone-pad'
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />
                </View>

                {/* signin button */}
                <TouchableOpacity
                  disabled={!phoneNumber.trim()}
                  style={[
                    defaultStyles.pillButton,
                    phoneNumber.trim() ? styles.enabled : styles.disabled,
                    { marginBottom: 20 },
                  ]}
                  onPress={() => onlogin(SignInType.Phone)}
                >
                  <Text style={defaultStyles.buttonText}>Continue</Text>
                </TouchableOpacity>

                  

                {/* social buttons */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                    <View  style={{flex:1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.gray}}/>
                    <Text style={{color: Colors.gray, fontSize: 20}}>Or</Text>
                    <View  style={{flex:1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.gray}}/>
                </View>

                <TouchableOpacity 
                  onPress={() => onlogin(SignInType.Email)}
                  style={[
                    defaultStyles.pillButton, 
                    {
                      backgroundColor: 'white',
                      flexDirection: 'row',
                      gap: 16,
                      marginTop: 16,

                    }]}
                >
                    <Ionicons name='mail' size={24} color={'#000'} />
                    <Text style={[defaultStyles.buttonText, {color:'#000'}]}>Continue with email</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => onlogin(SignInType.Google)}
                  style={[
                    defaultStyles.pillButton, 
                    {
                      backgroundColor: 'white',
                      flexDirection: 'row',
                      gap: 16,
                      marginTop: 16,

                    }]}
                >
                    <Ionicons name='logo-google' size={24} color={'#000'} />
                    <Text style={[defaultStyles.buttonText, {color:'#000'}]}>Continue with google</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => onlogin(SignInType.Apple)}
                  style={[
                    defaultStyles.pillButton, 
                    {
                      backgroundColor: 'white',
                      flexDirection: 'row',
                      gap: 16,
                      marginTop: 16,

                    }]}
                >
                    <Ionicons name='logo-apple' size={24} color={'#000'} />
                    <Text style={[defaultStyles.buttonText, {color:'#000'}]}>Continue with Apple</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
        
  )
}

export default Login;

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