
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRandomColor } from './Avatar';


const Tag = ({ 
    name, 
    color, // Optional custom color override
    textColor = '#000',
    style
}) => {
    const backgroundColor = useMemo(() => {
        return color || getRandomColor(name);
    }, [name, color]);

    return (
        <View style={[
            styles.tag, 
            { backgroundColor },
            style
        ]}>
            <Text style={{ color: textColor }}>
                {name}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tag: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 8,
    }
});

export default Tag