import { SectionList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams } from 'expo-router'
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

const page = () => {
  const { id } = useLocalSearchParams();
  const headerHeight = useHeaderHeight();

  return (
    <>
      <Stack.Screen options={{ title: 'Bitcoin' }} />
      <SectionList
        style={{ paddingTop: headerHeight }}
        contentInsetAdjustmentBehavior='automatic'
        keyExtractor={(i) => i.title}
        sections={[{data: [{title:'Chart'}] }]}
        ListHeaderComponent={() => (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginHorizontal: 16
              }}
            >
              <Text style={styles.subtitle}>BTC</Text>
            </View>
          </>
        )}
        renderItem={({item}) => 
          <>
              <View style={[defaultStyles.block, { marginTop: 20 }]}>
                <Text style={styles.subtitle}>Overview</Text>
                <Text style={{ color: Colors.gray }}>
                  Bitcoin is a decentralized digital currency, without a central bank or single
                  administrator, that can be sent from user to user on the peer-to-peer bitcoin
                  network without the need for intermediaries. Transactions are verified by network
                  nodes through cryptography and recorded in a public distributed ledger called a
                  blockchain.
                </Text>
              </View>
          </>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.gray,
  },
});

export default page;