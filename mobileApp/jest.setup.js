require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-document-scanner-plugin', () => ({
  scanDocument: jest.fn(async () => ({scannedImages: []})),
}));

jest.mock('@react-navigation/native/src/useBackButton.native', () => () => {});
jest.mock(
  '@react-navigation/native/lib/commonjs/useBackButton.native',
  () => () => {},
);

jest.mock('@react-navigation/native/src/useLinking.native', () => () => ({
  getInitialState: () => Promise.resolve(undefined),
}));
jest.mock(
  '@react-navigation/native/lib/commonjs/useLinking.native',
  () => () => ({
    getInitialState: () => Promise.resolve(undefined),
  }),
);

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(async () => ({idToken: 'test-id-token', accessToken: 'test-access-token'})),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  },
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const {View} = require('react-native');

  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 390, height: 844};

	return {
	  SafeAreaProvider: ({children}) => children,
	  SafeAreaView: ({children, ...props}) =>
	    React.createElement(View, props, children),
	  SafeAreaInsetsContext: React.createContext(inset),
	  SafeAreaFrameContext: React.createContext(frame),
	  useSafeAreaInsets: () => inset,
	  useSafeAreaFrame: () => frame,
	  initialWindowMetrics: {
	    frame,
	    insets: {top: 47, left: 0, right: 0, bottom: 34},
	  },
	};
});
