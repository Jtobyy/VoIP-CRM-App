import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../../../styles/global';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { useAuth } from '../../../hooks/useAuth';
import { CommonActions } from '@react-navigation/native';
import Avatar from '../../../components/Avatar';

const ManageAccount = ({ navigation }) => {
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'disable' or 'delete'

  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();
  const { logout } = useAuth();

  const handleDisableAccount = () => {
    setShowDisableModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDisableAccount = async () => {
    try {
      setLoading(true);
      setShowDisableModal(false);

      const response = await api.post('/users/account/disable/');

      if (response.data?.success) {
        setActionType('disable');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Failed to disable account:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const proceedToDeleteConfirmation = () => {
    setShowDeleteModal(false);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation.toUpperCase() !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      setShowDeleteConfirmModal(false);

      const response = await api.post('/users/account/delete/');

      if (response.data?.success) {
        setActionType('delete');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      handleApiError(error);
      setDeleteConfirmation('');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessAction = async () => {
    setShowSuccessModal(false);
    
    // Logout user and clear all data
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear all navigation and go to login screen
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

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
        <Text style={styles.headerTitle}>Manage Account</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <View style={styles.content}>
        {/* Disable Account Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleDisableAccount}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, styles.disableIconCircle]}>
            <Avatar
              name={null}
              size={50}
              image={require('../../../assets/ic_disable_account.png')}
              badge={null}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Disable Account</Text>
            <Text style={styles.cardSubtitle}>Take a break. Reactivate anytime</Text>
          </View>
        </TouchableOpacity>

        {/* Delete Account Card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, styles.deleteIconCircle]}>
            <Avatar
              name={null}
              size={50}
              image={require('../../../assets/ic_delete_account.png')}
              badge={null}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Delete Account</Text>
            <Text style={styles.cardSubtitle}>Permanently delete everything</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Disable Account Modal */}
      <Modal
        visible={showDisableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDisableModal(false)}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <View style={styles.modalIconContainer}>
              <Avatar
                name={null}
                size={70}
                image={require('../../../assets/ic_disable_account.png')}
                badge={null}
              />
            </View>

            <Text style={styles.modalTitle}>Disable your account?</Text>
            <Text style={styles.modalSubtitle}>
              You won't be able to sign in until it is reactivated. You can come back anytime.
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmDisableAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Disable Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDisableModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Warning Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <View style={styles.modalIconContainer}>
              <Avatar
                name={null}
                size={70}
                image={require('../../../assets/ic_delete_account.png')}
                badge={null}
              />
            </View>

            <Text style={styles.modalTitle}>Delete forever?</Text>
            <Text style={styles.modalSubtitle}>
              If you delete your account, you lose all of your data on NativeTalk Business. This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={[styles.confirmButton, styles.deleteConfirmButton]}
              onPress={proceedToDeleteConfirmation}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Final Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteConfirmModal(false);
          setDeleteConfirmation('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowDeleteConfirmModal(false);
                setDeleteConfirmation('');
              }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <View style={styles.modalIconContainer}>
              <Avatar
                name={null}
                size={70}
                image={require('../../../assets/ic_delete_account.png')}
                badge={null}
              />
            </View>

            <Text style={styles.modalTitle}>Final confirmation</Text>
            <Text style={styles.modalSubtitle}>
              Type "DELETE" to permanently delete your account
            </Text>

            <View style={styles.confirmationInputContainer}>
              <TextInput
                style={styles.confirmationInput}
                placeholder='Type "DELETE" to confirm'
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                autoCapitalize="characters"
                placeholderTextColor="#999"
              />
              {deleteConfirmation.toUpperCase() === 'DELETE' && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.deleteForeverButton,
                deleteConfirmation.toUpperCase() !== 'DELETE' && styles.deleteForeverButtonDisabled
              ]}
              onPress={confirmDeleteAccount}
              activeOpacity={0.8}
              disabled={deleteConfirmation.toUpperCase() !== 'DELETE'}
            >
              <Text style={styles.deleteForeverButtonText}>Delete Forever</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepAccountButton}
              onPress={() => {
                setShowDeleteConfirmModal(false);
                setDeleteConfirmation('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.keepAccountButtonText}>Keep Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconContainer}>
              <View style={styles.successCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>
            </View>

            <Text style={styles.successTitle}>
              {actionType === 'disable' ? 'Account Disabled' : 'Account Deleted'}
            </Text>
            <Text style={styles.successMessage}>
              {actionType === 'disable' 
                ? 'Your account has been disabled successfully. You will not be able to sign in until it is reactivated.' 
                : 'Your account has been deleted successfully. This action cannot be undone.'}
            </Text>

            <TouchableOpacity
              style={styles.proceedButton}
              onPress={handleSuccessAction}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedButtonText}>Proceed to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    padding: 5,
  },

  backButtonIcon: {
    width: 20,
    height: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },

  headerRight: {
    width: 34,
  },

  content: {
    padding: 20,
  },

  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  disableIconCircle: {
    backgroundColor: '#E8F5E9',
  },

  deleteIconCircle: {
    backgroundColor: '#FFEBEE',
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 14,
    color: '#999',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },

  closeIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '300',
  },

  modalIconContainer: {
    marginBottom: 24,
    marginTop: 16,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },

  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  deleteConfirmButton: {
    backgroundColor: colors.primary,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  cancelButton: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: '600',
  },

  confirmationInputContainer: {
    width: '100%',
    marginBottom: 24,
    position: 'relative',
  },

  confirmationInput: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },

  checkmarkContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  deleteForeverButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },

  deleteForeverButtonDisabled: {
    backgroundColor: '#FFCDD2',
    opacity: 0.6,
  },

  deleteForeverButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  keepAccountButton: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },

  keepAccountButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: '600',
  },

  // Success Modal
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  successIconContainer: {
    marginBottom: 24,
    marginTop: 16,
  },

  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successCheckmark: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },

  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  proceedButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },

  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ManageAccount;