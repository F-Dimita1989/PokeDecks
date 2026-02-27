import { useRouter as useExpoRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Colori e font a tema Pokémon
    const mainColor = '#3B4CCA'; // blu Pokémon
    const accentColor = '#fff'; // bianco
    const redColor = '#E3350D'; // rosso Pokéball

    const handleLogin = () => {
        // Logica di login fittizia
        if (!email || !password) {
            setError('Inserisci email e password');
            return;
        }
        // Demo: login valido solo se email contiene "@" e password >= 4 caratteri
        if (email.includes('@') && password.length >= 4) {
            setError('');
            router.replace('/(tabs)/explore'); // reindirizza allo scanner
        } else {
            setError('Credenziali non valide');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>PokéDecks Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#B0B0B0"
                        accessibilityLabel="Campo email"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#B0B0B0"
                        accessibilityLabel="Campo password"
                    />
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TouchableOpacity style={styles.button} onPress={handleLogin} accessibilityLabel="Accedi">
                        <Text style={styles.buttonText}>Accedi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/register')}>
                        <Text style={styles.secondaryButtonText}>Registrati</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#1E293B', // dark background
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#23272F', // dark card
        borderRadius: 18,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#23272F',
        overflow: 'hidden',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 18,
        alignSelf: 'center',
        letterSpacing: 0.5,
        color: '#F8F9FA', // light text
        fontFamily: 'sans-serif',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#2C2F36', // input dark
        borderColor: '#444',
        color: '#F8F9FA', // light text
        fontFamily: 'sans-serif',
        width: '100%',
    },
    error: {
        color: '#E63946', // error red
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: '600',
        fontFamily: 'sans-serif',
        fontSize: 15,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 12,
        alignItems: 'center',
        backgroundColor: '#457B9D', // accent blue
        borderWidth: 0,
        width: '100%',
    },
    buttonText: {
        color: '#F8F9FA', // light text
        fontWeight: 'bold',
        fontSize: 17,
        letterSpacing: 0.2,
        fontFamily: 'sans-serif',
    },
    secondaryButton: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#23272F', // dark card
        borderWidth: 1,
        borderColor: '#457B9D', // accent blue
        marginBottom: 8,
        width: '100%',
    },
    secondaryButtonText: {
        color: '#457B9D', // accent blue
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.2,
        fontFamily: 'sans-serif',
    },
});
export function useRouter() {
    return useExpoRouter();
}

