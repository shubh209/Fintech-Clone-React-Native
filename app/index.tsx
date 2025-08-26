import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { useAssets } from 'expo-asset'
import { Video } from 'expo-av'

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
        />
      )}

      {/* the header content */}
      <View style={{marginTop:80, padding: 20}}>
        <Text style={styles.header}>Ready to change the way you money?</Text>
      </View>

      {/* the buttons at the bottom */}
      <View style={styles.buttons}>
         <TouchableOpacity>
          
         </TouchableOpacity>
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
  },
})

export default Page 