export const colors = {
    primary: '#3EBF0F',       // Main theme color
    primaryDark: '#2F9A0B',   // Darker shade
    primaryLight: '#E8F5E9',  // Lighter shade
    secondary: '#115BC7',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#929292',
    lightGray: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
  };
  
  export const typography = {
    text1: {
      fontSize: 27,
      fontWeight: 'bold',
      color: colors.black,
    },
    heading1: {
      fontSize: 25,
      fontWeight: 'bold',
      color: colors.black,
    },
    heading2: {
      fontSize: 23,
      fontWeight: '500',
      color: colors.black,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.black,
    },
    body: {
      fontSize: 16,
      color: colors.gray,
    },
    body2: {
      fontSize: 15,
      color: colors.gray,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
  };
  
  // Common button styles
  export const buttons = {
    primary: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
  };

  export const containers = {
    rootContainer: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
  }