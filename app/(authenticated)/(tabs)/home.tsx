import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Colors from '@/constants/Colors';
import RoundButton from '@/Components/RoundButton';
import DropDown from '@/Components/DropDown';

const home = () => {
  
  const balance = 1240;

  const onAddMoney = () => {

  };

  return (
    <ScrollView style={{backgroundColor: Colors.background}}>

      {/* the middle section */}
      <View style={styles.account}>
        {/* the balance and curreency view */}
        <View style={styles.row}>
          <Text style={styles.balance}>{balance}</Text>
          <Text style={styles.currency}>$</Text>
        </View>
      </View>

      {/* the action buttons row */}
      <View style={styles.actionRow}>
        <RoundButton icon={'add'} text={'Add Money'} onPress={onAddMoney}/>
        <RoundButton icon={'refresh'} text={'Exchange'} />
        <RoundButton icon={'list'} text={'Details'} onPress={onAddMoney}/>
        <DropDown />
      </View>
    </ScrollView>
  )
}

export default home;

const styles = StyleSheet.create({
  account:{
    marginTop: 80,
    alignItems: 'center',
  },
  row:{
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '90%',
  },
  balance:{
    fontSize: 50,
    fontWeight: 'bold'
  },
  currency:{
    fontSize: 30,
    fontWeight: '500',
  },
  actionRow:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
})