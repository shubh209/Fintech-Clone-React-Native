import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Colors from '@/constants/Colors';
import RoundButton from '@/Components/ui/RoundButton';
import DropDown from '@/Components/ui/DropDown';
import { useBalanceStore } from '@/Store/balance/balanceStore';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import WidgetList from '@/Components/sortable-list/WidgetList';
import { useHeaderHeight } from '@react-navigation/elements';

const home = () => {
  
  const {balance, runTransaction, clearTansactions, transactions} = useBalanceStore();

  const headerHeight = useHeaderHeight();

  const onAddMoney = () => {
    runTransaction({
        id: Math.random().toString(),
        amount: Math.floor(Math.random() * 1000) * (Math.random() > 0.5 ? 1 : -1),
        date: new Date(),
        title: 'Added Money',
    });

  };

  return (
    <ScrollView 
      style={{backgroundColor: Colors.background}}
      contentContainerStyle={{paddingTop: headerHeight, paddingBottom: 500}}
    >

      {/* the middle section */}
      <View style={styles.account}>
        {/* the balance and curreency view */}
        <View style={styles.row}>
          <Text style={styles.balance}>{balance()}</Text>
          <Text style={styles.currency}>$</Text>
        </View>
      </View>

      {/* the action buttons row */}
      <View style={styles.actionRow}>
        <RoundButton icon={'add'} text={'Add Money'} onPress={onAddMoney}/>
        <RoundButton icon={'refresh'} text={'Exchange'} onPress={clearTansactions}/>
        <RoundButton icon={'list'} text={'Details'} onPress={onAddMoney}/>
        <DropDown />
      </View>


      {/* the transaction history */}
      <Text style={defaultStyles.sectionHeader}>Transactions</Text>
      <View style={styles.transaction}>
        {transactions.length === 0 && (
          <Text style={{textAlign: 'center', marginTop: 20, color: Colors.lightGray}}>No Transactions Yet</Text>)  
        }
        {
          // + or -  sign based on the amount
          transactions.reverse().map((transactions) => (
            <View key={transactions.id} style={{flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20}}>
              <View style={styles.circle}>
                <Ionicons name={transactions.amount > 0 ? 'add' : 'remove'} size={24} color={Colors.dark}/>
              </View>

              {/* transaction details */}
              <View style={{flex: 1}}>  
                <Text style={{fontSize: 16, fontWeight: '600'}}>{transactions.title}</Text>
                <Text style={{color: Colors.gray, fontSize: 12}}>{transactions.date.toLocaleDateString()}</Text>
              </View>
              <Text>{transactions.amount}$</Text>
            </View>
          ))
        }
      </View>
      
      {/* the widgets section */}
      <Text style={defaultStyles.sectionHeader}>Widgets</Text>
      <WidgetList />
    </ScrollView>
  )
}


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
  transaction:{
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    gap:20,
  },
  circle:{
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.lightGray,
  }
})

export default home;