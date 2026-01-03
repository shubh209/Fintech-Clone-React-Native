import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '@/interfaces/crypto';
import { useHeaderHeight } from '@react-navigation/elements';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { Ionicons } from '@expo/vector-icons';

const CryptoScreen = () => {
  const headerHeight = useHeaderHeight();

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const res = await fetch('/api/listings');
      if (!res.ok) throw new Error('Failed to fetch listings');
      return res.json();
    },
  });

  const currencies: Currency[] = listingsQuery.data ?? [];
  const ids = currencies.map((c) => c.id).join(',');

  const infoQuery = useQuery({
    queryKey: ['info', ids],
    enabled: !!ids,
    queryFn: async () => {
      if (!ids) throw new Error('Missing ids');
      const res = await fetch(`/api/info?ids=${ids}`);
      if (!res.ok) throw new Error('Failed to fetch info');
      return res.json();
    },
  });

  const info = infoQuery.data ?? {};

  return (
    <ScrollView
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingTop: headerHeight }}
    >
      <Text style={defaultStyles.sectionHeader}>Latest Crypto</Text>

      <View style={defaultStyles.block}>
        {currencies.map((currency) => (
          <Link
            key={currency.id}
            href={`/(authenticated)/crypto/${currency.id}`}
            asChild
          >
            <TouchableOpacity style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              {info[currency.id]?.logo ? (
                <Image
                  source={{ uri: info[currency.id].logo }}
                  style={{ width: 40, height: 40 }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#e0e0e0',
                  }}
                />
              )}

              <View style={{ flex: 1, gap: 10 }}>
                <Text style={{ fontWeight: '600', color: Colors.dark }}>
                  {currency.name}
                </Text>
                <Text style={{ color: Colors.gray }}>{currency.symbol}</Text>
              </View>

              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <Text>${currency.quote.EUR.price.toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Ionicons
                    name={
                      currency.quote.EUR.percent_change_1h > 0
                        ? 'caret-up'
                        : 'caret-down'
                    }
                    size={16}
                    color={
                      currency.quote.EUR.percent_change_1h > 0 ? 'green' : 'red'
                    }
                  />
                  <Text
                    style={{
                      color:
                        currency.quote.EUR.percent_change_1h > 0
                          ? 'green'
                          : 'red',
                    }}
                  >
                    {currency.quote.EUR.percent_change_1h.toFixed(2)} %
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({});

export default CryptoScreen;
