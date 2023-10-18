// components/FolderIcon.js
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const FolderIcon = () => (
  <Svg width="50" height="50" viewBox="0 0 512 512">
    <Path
      fill="#9E9E9E"  // You can change the color here
      d="M448 480H64c-35.3 0-64-28.7-64-64V192H512V416c0 35.3-28.7 64-64 64zm64-320H0V96C0 60.7 28.7 32 64 32H192c20.1 0 39.1 9.5 51.2 25.6l19.2 25.6c6 8.1 15.5 12.8 25.6 12.8H448c35.3 0 64 28.7 64 64z"
    />
  </Svg>
);

export default FolderIcon;