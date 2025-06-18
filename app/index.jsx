import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constant/Colors";

export default function Index() {

  const router=useRouter();


  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.WHITE,
      }}>
      
    <Image source = {require('../assets/images/start.jpg')} 
    style={{
      width:'100%' , 
      height: 450, 
      marginTop: 70,
     }} />

     <View style={{
      padding: 27,
      backgroundColor: 'rgb(16, 26, 83)',
      height: '100%',
      borderTopLeftRadius:0,
      borderTopRightRadius:0,      
       }}>

      <Text style={{
        color: Colors.WHITE,
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
      }}> Welcome to CarMinder!</Text>

      <Text style={{
        color: Colors.WHITE,
        fontSize: 20,
        textAlign: 'center',
        marginTop: 10,           
        
      }}> Start with Vehical Maintain Easier.. </Text>

      <TouchableOpacity style={styles.button}
      onPress={()=>router.push('/auth/signUp')}>
        <Text style={[styles.buttonText,{color:Colors.BLUE_DARK}]}>Get Started</Text>
      </TouchableOpacity>

        <TouchableOpacity style={[styles.button,{backgroundColor:'rgb(14, 26, 73)',borderColor:Colors.WHITE,borderWidth:1}]}
        onPress={()=>router.push('/auth/signIn')}>
        <Text style={[styles.buttonText,{color:Colors.WHITE}]}>Already have an Account</Text>
      </TouchableOpacity>



     </View>
    
     
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.WHITE,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.BLACK,
  },
  buttonText: {
    color: Colors.GREEN_DARK || 'green',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
})