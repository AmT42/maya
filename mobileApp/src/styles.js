import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5', // a light grey background color that's easy on the eyes
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333', // dark text color for better readability
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 44,
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd', // a subtle border for the input fields
    marginBottom: 20,
    backgroundColor: '#FFF', // a white background for the input fields
  },
  buttonContainer: {
    width: '100%',
    height: 50,
    marginTop: 12,
    backgroundColor: '#4E9FDF', // choose a color that suits your app's overall design
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4, // slightly rounded corners
    elevation: 2, // give a slight shadow
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30', // red color for errors
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '400',
  },
});