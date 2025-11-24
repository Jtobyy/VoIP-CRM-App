import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ImageBackground,
    Image,
    ScrollView,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const SalesAnalytics = ({ navigation }) => {
    // Dummy data for revenue cards
    const revenueData = [
        { period: 'Today', amount: 45650, change: 10.5 },
        { period: 'This Week', amount: 234500, change: 10.5 },
        { period: 'This Month', amount: 892340, change: 10.5 },
    ];

    // Dummy data for top selling products
    const topProducts = [
        { rank: 1, name: 'Wireless Headphones', units: 45, revenue: 675000 },
        { rank: 2, name: 'Premium Coffee Beans', units: 45, revenue: 95000 },
        { rank: 3, name: 'Hand Sanitizer', units: 45, revenue: 11200 },
        { rank: 4, name: 'Notebook Set', units: 45, revenue: 22400 },
        { rank: 4, name: 'Notebook Set', units: 45, revenue: 22800 },
    ];

    // Dummy data for low stock items
    const lowStockItems = [
        { name: 'Organic Green Tea', category: 'Beverages', stock: 3, status: 'low' },
        { name: 'USB Cable', category: 'Electronics', stock: 0, status: 'out' },
    ];

    // Dummy data for stats cards
    const statsData = [
        { label: 'Avg. Order Value', value: 6110, icon: 'dollar-sign' },
        { label: 'Total Orders', value: 146, icon: 'box' },
        { label: 'Products Sold', value: 412, icon: 'chart-line' },
        { label: 'Low Stock Items', value: 2, icon: 'triangle-exclamation', isWarning: true },
    ];

    const formatCurrency = (amount) => {
        return `₦${amount.toLocaleString()}`;
    };

    const renderRevenueCard = (item, index) => {
        const isFullWidth = index === 2;

        return (
            <View
                key={index}
                style={[
                    styles.revenueCard,
                    isFullWidth && styles.revenueCardFull,
                ]}
            >
                <View style={styles.revenueHeader}>
                    <Text style={styles.revenuePeriod}>{item.period}</Text>
                    <View style={styles.changeContainer}>
                        <FontAwesome6
                            name="arrow-up"
                            size={12}
                            color={colors.primary}
                            iconStyle="solid"
                        />
                        <Text style={styles.changeText}>{item.change}%</Text>
                    </View>
                </View>
                <Text style={styles.revenueAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.revenueLabel}>Total sales revenue</Text>
            </View>
        );
    };

    const renderTopProduct = (item, index) => (
        <View key={index} style={styles.productItem}>
            <View style={styles.productLeft}>
                <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{item.rank}</Text>
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productUnits}>{item.units} units sold</Text>
                </View>
            </View>
            <View style={styles.productRight}>
                <Text style={styles.productRevenue}>{formatCurrency(item.revenue)}</Text>
                <Text style={styles.productRevenueLabel}>revenue</Text>
            </View>
        </View>
    );

    const renderLowStockItem = (item, index) => (
        <View key={index} style={styles.stockItem}>
            <View style={styles.stockLeft}>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockCategory}>{item.category}</Text>
            </View>
            <View style={styles.stockRight}>
                {item.status === 'out' ? (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.stockNumber}>{item.stock}</Text>
                        <Text style={styles.stockLabel}>units left</Text>
                    </>
                )}
            </View>
        </View>
    );

    const renderStatCard = (item, index) => (
        <View key={index} style={styles.statCard}>
            <View style={styles.statHeader}>
                <FontAwesome6
                    name={item.icon}
                    size={16}
                    color="#9CA3AF"
                    iconStyle="solid"
                />
                <Text style={styles.statLabel}>{item.label}</Text>
            </View>
            <Text style={[
                styles.statValue,
                item.isWarning && styles.statValueWarning
            ]}>
                {typeof item.value === 'number' && item.label === 'Avg. Order Value'
                    ? formatCurrency(item.value)
                    : item.value
                }
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

            {/* Header */}
            <ImageBackground
                source={require('../../../assets/header_bg.png')}
                style={styles.header}
                resizeMode="cover"
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Image
                        source={require('../../../assets/backWhite.png')}
                        style={styles.backButtonIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Sales Analytics</Text>
                <View style={styles.headerRight} />
            </ImageBackground>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Revenue Cards */}
                <View style={styles.revenueSection}>
                    <View style={styles.revenueRow}>
                        {revenueData.slice(0, 2).map(renderRevenueCard)}
                    </View>
                    {renderRevenueCard(revenueData[2], 2)}
                </View>

                {/* Top 5 Selling Products */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top 5 Selling Products</Text>
                    <View style={styles.sectionContent}>
                        {topProducts.map(renderTopProduct)}
                    </View>
                </View>

                {/* Stock Running Low */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stock Running Low</Text>
                    <View style={styles.sectionContent}>
                        {lowStockItems.map(renderLowStockItem)}
                        <TouchableOpacity style={styles.restockButton}>
                            <Text style={styles.restockText}>Restock Products</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    {statsData.map(renderStatCard)}
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: 80,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {},
    backButtonIcon: {
        width: 20,
        height: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 20,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    revenueSection: {
        marginBottom: 16,
    },
    revenueRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    revenueCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    revenueCardFull: {
        flex: 1,
    },
    revenueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    revenuePeriod: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    changeText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    revenueAmount: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    revenueLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    productLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 2,
    },
    productUnits: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    productRight: {
        alignItems: 'flex-end',
    },
    productRevenue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
        marginBottom: 2,
    },
    productRevenueLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    stockItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#FCD34D',
        backgroundColor: '#FFFBEB',
    },
    stockLeft: {
        flex: 1,
    },
    stockName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 2,
    },
    stockCategory: {
        fontSize: 13,
        color: '#6B7280',
    },
    stockRight: {
        alignItems: 'flex-end',
    },
    stockNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    stockLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    outOfStockBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    outOfStockText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#DC2626',
    },
    restockButton: {
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: 4,
    },
    restockText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111',
    },
    statValueWarning: {
        color: '#F97316',
    },
    bottomPadding: {
        height: 20,
    },
});

export default SalesAnalytics;