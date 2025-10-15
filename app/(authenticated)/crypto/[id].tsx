import { Image, ScrollView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams } from 'expo-router'
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CartesianChart, Line } from "victory-native";
import { useFont } from '@shopify/react-native-skia';
import { format, formatDate } from 'date-fns';


const page = () => {
  const { id } = useLocalSearchParams();
  const headerHeight = useHeaderHeight();
  const categories = ['Overview', 'News', 'Orders', 'Transactions'];
  const [activeIndex, setActiveIndex] = useState(0);
  const font = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), 12); 

  const { data } = useQuery({
    queryKey: ['info', id],
    queryFn: async () => {
      const info = await fetch(`/api/info?ids=${id}`).then((res) => res.json());
      return info[+id];
    },

  });

  const { data: tickers } = useQuery({
    queryKey: ['tickers'],
    queryFn: async (): Promise<any[]> => fetch(`/api/tickers`).then((res) => res.json()),
  });
  
  return (
    <>
      <Stack.Screen options={{ title: data?.name }} />
      <SectionList
        style={{ paddingTop: headerHeight }}
        contentInsetAdjustmentBehavior='automatic'
        keyExtractor={(i) => i.title}
        sections={[{data: [{title:'Chart'}] }]}
        renderSectionHeader={() => (
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingHorizontal: 15,
              paddingBottom: 6,
              backgroundColor: Colors.background,
              borderBottomColor: Colors.lightGray,
              borderBottomWidth: StyleSheet.hairlineWidth,
            }}
          >
            {categories.map((item, index)=> (
              <TouchableOpacity
                key={index}
                style={activeIndex === index ? styles.categoriesBtnActive : styles.categoriesBtn}
                onPress={() => setActiveIndex(index)}
              >
                <Text style={activeIndex === index ? styles.categoryTextActive : styles.categoryText}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
              <Text style={styles.subtitle}>{data?.symbol}</Text>
              <Image source={{uri: data?.logo}} style={{width:50, height: 50}} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, margin: 12 }}>
              <TouchableOpacity
                style={[
                  defaultStyles.pillButtonSmall,
                  { backgroundColor: Colors.primary, flexDirection: 'row', gap: 16 },
                ]}>
                <Ionicons name="add" size={24} color={'#fff'} />
                <Text style={[defaultStyles.buttonText, { color: '#fff' }]}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  defaultStyles.pillButtonSmall,
                  { backgroundColor: Colors.primaryMuted, flexDirection: 'row', gap: 16 },
                ]}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                <Text style={[defaultStyles.buttonText, { color: Colors.primary }]}>Receive</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({item}) => 
          <>
            <View style={[defaultStyles.block, {height: 300} ]}>
              {tickers && (
                <CartesianChart 
                  data={tickers} 
                  xKey="timestamp" 
                  yKeys={["price"]}
                  axisOptions={{
                    font,
                    tickCount: 5,
                    labelOffset: {x: -5, y: 0},
                    labelColor: Colors.gray,
                    formatXLabel: (v) => `${v} $`,
                    formatYLabel: (ms) => format(new Date(ms), 'MM/yy')
                  }}
                >
                  {({ points }) => (
                    <Line points={points.price} color={Colors.primary} strokeWidth={3} />
                  )}
                </CartesianChart>
              )}
            </View>
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
  categoryText: {
    fontSize: 14,
    color: Colors.gray,
  },
  categoryTextActive: {
    fontSize: 14,
    color: '#000',
  },
  categoriesBtn: {
    padding: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  categoriesBtnActive: {
    padding: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
  },
});

export default page;