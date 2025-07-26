import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const getRandomColor = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed?.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
        '#E67E22', '#1ABC9C', '#34495E', '#7F8C8D'
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

// Helper to lighten/darken colors
const adjustColor = (color, amount = 0) => {
    // Convert HEX to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Lighten or darken
    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));
    
    // Convert back to HEX
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getInitials = (name) => {
    if (!name) return '--';
    const nameParts = name.split(' ');
    
    const firstLetter = nameParts[0].charAt(0).toUpperCase();
    
    let secondLetter = '';
    if (nameParts[1] && nameParts[1].length >= 2) {
        secondLetter = nameParts[1].charAt(0).toUpperCase();
    } else {
        secondLetter = nameParts[0].charAt(1)?.toLowerCase() || '-';
    }
    
    return firstLetter + secondLetter;
};

const Avatar = ({ 
    name,
    size = 40,
    color, // Optional custom color override
    lightenAmount = 80, // How much to lighten the background
    darkenAmount = 60,  // How much to darken the text
    fontSize = 16,
    style,
    badge, // Image to show as badge/icon at bottom
    image // Image to replace the entire avatar content
}) => {
    const initials = getInitials(name);
    
    const baseColor = useMemo(() => color || getRandomColor(name), [name, color]);
    const bgColor = adjustColor(baseColor, lightenAmount); // Lightened background
    const textColor = adjustColor(baseColor, -darkenAmount); // Darkened text
    
    
    const badgeIconSize = size * 0.35; // Badge icon is 35% of avatar size
    
    return (
        <View style={[styles.avatarContainer, style]}>
            <View
                style={[
                    styles.avatar,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: image ? 'transparent' : bgColor,
                    }
                ]}
            >
                {image ? (
                    // Show main image if provided
                    <Image
                        source={typeof image === 'string' ? { uri: image } : image}
                        style={{
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        }}
                        resizeMode="cover"
                    />
                ) : (
                    // Show initials if no main image
                    <Text
                        style={{
                            color: textColor,
                            fontSize: fontSize,
                            fontWeight: 'bold',
                        }}
                    >
                        {initials}
                    </Text>
                )}
            </View>
            
            {/* Badge icon at bottom */}
            {badge && (
                <View
                    style={[
                        styles.badgeContainer,
                        {
                            width: badgeIconSize,
                            height: badgeIconSize,
                            borderRadius: badgeIconSize / 2,
                            bottom: -2,
                            right: -2,
                        }
                    ]}
                >
                    <Image
                        source={typeof badge === 'string' ? { uri: badge } : badge}
                        style={{
                            width: badgeIconSize - 4, // Slightly smaller to account for border
                            height: badgeIconSize - 4,
                            borderRadius: (badgeIconSize - 4) / 2,
                        }}
                        resizeMode="cover"
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 2, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    }
});

export default Avatar;
export { getRandomColor };