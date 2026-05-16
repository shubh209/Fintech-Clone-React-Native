import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Colors from '@/constants/Colors';
import RoundButton from '@/Components/ui/RoundButton';
import DropDown from '@/Components/ui/DropDown';
import { useBalanceStore } from '@/Store/balance/balanceStore';
import { Ionicons } from '@expo/vector-icons';
import WidgetList from '@/Components/sortable-list/WidgetList';
import { useHeaderHeight } from '@react-navigation/elements';
import { getBalanceSyncStatusCopy } from '@/Store/balance/balanceSyncStatus';
import { formatTransactionDate, getTransactionsNewestFirst } from '@/Store/balance/transactionUtils';
import { Href, useRouter } from 'expo-router';

const formatDollarAmount = (amount: number) => {
  const absoluteAmount = Math.abs(amount).toLocaleString('en-US');
  return `${amount < 0 ? '-' : ''}$${absoluteAmount}`;
};

const Home = () => {
  
  const {balance, runTransaction, clearTansactions, transactions, syncStatus} = useBalanceStore();
  const router = useRouter();

  const headerHeight = useHeaderHeight();
  const displayedTransactions = getTransactionsNewestFirst(transactions).slice(0, 3);
  const currentBalance = balance();
  const syncStatusCopy = getBalanceSyncStatusCopy(syncStatus);
  const incomeTotal = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const spendTotal = Math.abs(
    transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + transaction.amount, 0)
  );

  const onAddMoney = () => {
    runTransaction({
        id: Math.random().toString(),
        amount: Math.floor(Math.random() * 900) + 100,
        date: new Date(),
        title: 'Added Money',
    });

  };

  const onDetails = () => {
    router.push('/(authenticated)/(tabs)/activity' as Href);
  };

  return (
    <ScrollView 
      style={{backgroundColor: Colors.background}}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + 28 }]}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.accountCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.eyebrow}>Total balance</Text>
            <View style={styles.row}>
              <Text style={styles.balance}>{formatDollarAmount(currentBalance)}</Text>
            </View>
          </View>
          <View style={styles.statusPill}>
            <Ionicons
              name={syncStatusCopy.tone === 'warning' ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={16}
              color={syncStatusCopy.tone === 'warning' ? '#9A5B00' : Colors.primary}
            />
            <Text
              style={[
                styles.statusText,
                syncStatusCopy.tone === 'warning' && styles.statusTextWarning,
              ]}
            >
              {syncStatusCopy.label}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="trending-up" size={18} color="#0A8F5A" />
            <View>
              <Text style={styles.summaryLabel}>In</Text>
              <Text style={styles.summaryValue}>{formatDollarAmount(incomeTotal)}</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="trending-down" size={18} color="#C24135" />
            <View>
              <Text style={styles.summaryLabel}>Out</Text>
              <Text style={styles.summaryValue}>{formatDollarAmount(spendTotal)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <RoundButton
          icon={'add'}
          text={'Add Money'}
          onPress={onAddMoney}
          accentColor={Colors.primary}
          iconColor="#fff"
        />
        <RoundButton
          icon={'swap-horizontal'}
          text={'Exchange'}
          onPress={clearTansactions}
          accentColor="#E8F5EF"
          iconColor="#0A8F5A"
        />
        <RoundButton
          icon={'receipt-outline'}
          text={'Details'}
          onPress={onDetails}
          accentColor="#EEF2FF"
          iconColor={Colors.primary}
        />
        <DropDown />
      </View>


      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <Text style={styles.sectionCaption}>{transactions.length} total</Text>
      </View>
      <View style={styles.transactionCard}>
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={24} color={Colors.gray}/>
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyCopy}>Add money to create your first activity entry.</Text>
          </View>)
        }
        {
          displayedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={[
                styles.transactionIcon,
                transaction.amount > 0 ? styles.transactionIconPositive : styles.transactionIconNegative,
              ]}>
                <Ionicons
                  name={transaction.amount > 0 ? 'arrow-down-left-box' : 'arrow-up-right-box'}
                  size={22}
                  color={transaction.amount > 0 ? '#0A8F5A' : '#C24135'}
                />
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDate}>{formatTransactionDate(transaction.date)}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.amount > 0 ? styles.amountPositive : styles.amountNegative,
                ]}
              >
                {formatDollarAmount(transaction.amount)}
              </Text>
            </View>
          ))
        }
      </View>
      
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Widgets</Text>
        <Text style={styles.sectionCaption}>Hold to reorder</Text>
      </View>
      <WidgetList />
    </ScrollView>
  )
}


const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  accountCard:{
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  row:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance:{
    fontSize: 44,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextWarning: {
    color: '#9A5B00',
  },
  summaryRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7EAF0',
    paddingTop: 18,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: '#E7EAF0',
    marginHorizontal: 14,
  },
  summaryLabel: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow:{
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
  },
  sectionCaption: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  transactionCard:{
    marginHorizontal: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 22,
    gap: 4,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyState: {
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCopy: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  transactionIcon:{
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconPositive: {
    backgroundColor: '#E8F5EF',
  },
  transactionIconNegative: {
    backgroundColor: '#FCEDEA',
  },
  transactionDetails: {
    flex: 1,
    gap: 3,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  transactionDate: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountPositive: {
    color: '#0A8F5A',
  },
  amountNegative: {
    color: '#C24135',
  }
})

export default Home;
