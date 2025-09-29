import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Currency } from '@/interfaces/crypto';
import { useHeaderHeight } from '@react-navigation/elements';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';

const crypto = () => {


  // this is onw way of doing api calls
  // useEffect( () => {
  //   const foo = async () => {
  //     const res = await fetch("/api/listings");
  //     const data = await res.json();
  //     console.log(data);
  //   }

  //   foo();
  // }, []);


  // but with queryClient from tanstack, it is lot easier and efficient.
  const headerHeight = useHeaderHeight();

  const currencies = useQuery({
    queryKey: ['listings'],
    queryFn: () => fetch('/api/listings').then((res) => res.json()),
  });

  const ids = currencies.data?.map((currency: Currency) => currency.id).join(',');

  const { data } = useQuery({
    queryKey: ['info', ids],
    queryFn: () => fetch(`/api/info?ids=${ids}`).then((res) => res.json()),
    enabled: !!ids,
  });

  return (
    <ScrollView
      style={{backgroundColor: Colors.background}}
      contentContainerStyle={{paddingTop: headerHeight}}
    >
      <Text style={defaultStyles.sectionHeader}>Latest Crypto</Text>
      <View style={defaultStyles.block}>
        {currencies.data?.map((currency: Currency) => (
            <Link
              href={{
                pathname: "./app/(authenticated)/crypto/[id].tsx",
                params: { id: currency.id.toString() },
              }}
              key={currency.id}
              asChild
            >

            <TouchableOpacity style={{flexDirection: 'row', gap: 16, alignItems:'center' }}>
              <Image source={{uri: data?.[currency.id].logo }} style={{ width: 40, height: 40}}/>
              {/* Crypto name */}
              <View style={{flex:1, gap:10}}>
                <Text style={{fontWeight: '600', color: Colors.dark}}>{currency.name}</Text>
                <Text style={{color: Colors.gray}}>{currency.symbol}</Text>
              </View>
              {/* Crypto values */}
              <View style={{gap: 6, alignItems:'flex-end'}}> 
                <Text>${currency.quote.EUR.price.toFixed(2)}</Text>
                <View style={{flexDirection: 'row', gap: 4}}>
                  <Ionicons
                    name={currency.quote.EUR.percent_change_1h > 0 ? 'caret-up' : 'caret-down'}
                    size={16}
                    color={currency.quote.EUR.percent_change_1h > 0 ? 'green' : 'red'}
                  />
                  <Text
                    style={{ color: currency.quote.EUR.percent_change_1h > 0 ? 'green' : 'red' }}>
                    {currency.quote.EUR.percent_change_1h.toFixed(2)} %
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ Link>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({});

export default crypto;
