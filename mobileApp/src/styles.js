import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
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
    height: 40,
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
  primaryButtonContainer: {
    width: '100%',
    height: 30,
    marginTop: 20,
    marginBottom: 10,
    paddingLeft:5,
    paddingRight:5,
    backgroundColor: '#4E9FDF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    elevation: 2,
  },
  secondaryButtonContainer: {
    marginTop: 5,
  },
  secondaryButtonText: {
    color: '#4E9FDF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

