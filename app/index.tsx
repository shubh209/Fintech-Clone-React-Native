import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { useAssets } from 'expo-asset'
import { ResizeMode, Video } from 'expo-av'
import { Link } from 'expo-router'
import { defaultStyles } from '@/constants/Styles'
import Colors from '@/constants/Colors'

const Page = () => {
  const [assets] = useAssets([require ('@/assets/videos/intro.mp4')]);
  return (
    <View style={styles.container}>

      {/* background video */}
      {assets && (
        <Video 
          source={{uri: assets[0].uri}} style={styles.video} 
          isMuted
          isLooping
          shouldPlay 
          resizeMode={ResizeMode.COVER}
        />
      )}

      {/* the header content */}
      <View style={{marginTop:80, padding: 20}}>
        <Text style={styles.header}>Ready to change the way you money?</Text>
      </View>

      {/* the buttons at the bottom */}
      <View style={styles.buttons}>

        {/* login button */}
        <Link 
          href={'/login'}  
          style={[defaultStyles.pillButton, {flex:1, backgroundColor: Colors.dark}]}
          asChild>
          <TouchableOpacity>
            <Text style={{color: 'white', fontSize: 22, fontWeight: '500'}}>Log In</Text>
          </TouchableOpacity>
        </Link>

        {/* signup button */}
        <Link 
          href={'/signup'}  
          style={[defaultStyles.pillButton, {flex:1, backgroundColor: Colors.dark}]}
          asChild>
          <TouchableOpacity>
            <Text style={{color: 'white', fontSize: 22, fontWeight: '500'}}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    justifyContent: 'space-between',
  },
  video:{
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  header:{
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  buttons:{
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 60,
    paddingHorizontal: 20
  },
})

export default Page 