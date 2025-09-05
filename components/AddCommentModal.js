import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { colors } from '../styles/global';

const AddCommentModal = React.forwardRef((props, ref) => {
  const [comment, setComment] = useState('');
   const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const text = comment.trim();
    if (!text || saving) return;

    try {
      setSaving(true);
      await props.onSave?.(text);      // let parent do the API call
      setComment('');                  // reset composer
      ref?.current?.close();           // close the sheet
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modalize
      ref={ref}
      adjustToContentHeight
      handleStyle={{ backgroundColor: '#ddd' }}
      modalStyle={styles.modal}
      onClosed={() => setComment('')}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Add Comment</Text>
        <View style={styles.separator} />

        <Text style={styles.label}>Comments</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write a comment..."
          multiline
          maxLength={300}
          value={comment}
          onChangeText={setComment}
        />
        <Text style={styles.charCount}>{comment.length}/300</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => ref?.current?.close()} disabled={saving}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
          style={[styles.saveButton, (!comment.trim() || saving) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!comment.trim() || saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
});

export default AddCommentModal;

const styles = StyleSheet.create({
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    color: '#888',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancel: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
