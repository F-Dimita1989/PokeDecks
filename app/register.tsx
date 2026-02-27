import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    // Tema elegante e professionale
    const mainColor = '#23272F'; // grigio scuro
    const accentColor = '#3498db'; // blu elegante
    const errorColor = '#E74C3C'; // rosso per errori
    const inputBg = '#2C2F36';
    const inputBorder = '#444';
    const buttonBg = '#3498db';
    const buttonText = '#fff';

    const handleRegister = () => {
        // Logica di registrazione fittizia
        if (!email || !password || !confirmPassword) {
            setError('Compila tutti i campi');
            return;
        }
        if (!email.includes('@')) {
            setError('Email non valida');
            return;
        }
        if (password.length < 4) {
            setError('Password troppo corta');
            return;
        }
        if (password !== confirmPassword) {
            setError('Le password non coincidono');
            return;
        }
        setError('');
        router.replace('/login'); // dopo registrazione torna al login
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Registrati</Text>
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
                    <TextInput
                        style={styles.input}
                        placeholder="Conferma Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor="#B0B0B0"
                        accessibilityLabel="Campo conferma password"
                    />
                    {!!error && <Text style={styles.error}>{error}</Text>}
                    <TouchableOpacity style={styles.button} onPress={handleRegister} accessibilityLabel="Registrati">
                        <Text style={styles.buttonText}>Registrati</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/login')}>
                        <Text style={styles.secondaryButtonText}>Torna al Login</Text>
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
