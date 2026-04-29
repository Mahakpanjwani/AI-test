import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function App() {
  const [token, setToken] = useState('');
  const [employeeCode, setEmployeeCode] = useState('EMP001');
  const [password, setPassword] = useState('password123');
  const [employees, setEmployees] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ visitType: 'Visitor', visitorName: '', phone: '', company: '', personToMeetId: '', idProof: '', email: '' });
  const [dashboard, setDashboard] = useState(null);

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeCode, password })});
    const data = await res.json();
    if (!res.ok) return Alert.alert('Login failed', data.message || 'Error');
    setToken(data.token);
    Alert.alert('Logged in');
  };

  const loadEmployees = async (search='') => {
    const res = await fetch(`${API}/employees?q=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` }});
    const data = await res.json();
    setEmployees(data);
  };

  const checkIn = async () => {
    const res = await fetch(`${API}/visits/check-in`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(form)});
    const data = await res.json();
    if (!res.ok) return Alert.alert('Check-in failed', data.message || 'Error');
    Alert.alert('Confirmation', 'Check-in done successfully');
    fetchDashboard();
  };

  const fetchDashboard = async () => {
    const res = await fetch(`${API}/dashboard/daily`, { headers: { Authorization: `Bearer ${token}` }});
    setDashboard(await res.json());
  };

  useEffect(() => { if (token) { loadEmployees(); fetchDashboard(); } }, [token]);

  if (!token) return <SafeAreaView style={{ padding: 16 }}><Text>ID</Text><TextInput value={employeeCode} onChangeText={setEmployeeCode} style={{ borderWidth: 1, marginBottom: 8 }}/><Text>Password</Text><TextInput secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, marginBottom: 8 }}/><Button title="Login" onPress={login}/></SafeAreaView>;

  return <SafeAreaView style={{ padding:16 }}>
    <Text style={{ fontSize:20, fontWeight:'bold' }}>Check-In</Text>
    {['visitType','visitorName','phone','company','idProof','email'].map((k) => <TextInput key={k} placeholder={k} value={form[k]} onChangeText={(v)=>setForm({...form,[k]:v})} style={{ borderWidth:1, marginVertical:4, padding:6 }}/>) }
    <TextInput placeholder='Search employee' value={q} onChangeText={(v)=>{ setQ(v); loadEmployees(v); }} style={{ borderWidth:1, marginVertical:4, padding:6 }}/>
    <FlatList data={employees} keyExtractor={(i)=>i.id} renderItem={({item}) => <TouchableOpacity onPress={()=>setForm({...form, personToMeetId:item.id})}><Text>{item.name} ({item.employeeCode})</Text></TouchableOpacity>} style={{ maxHeight: 120 }}/>
    <Button title='Submit Check-In' onPress={checkIn} />
    <Button title='Refresh Dashboard' onPress={fetchDashboard} />
    {dashboard && <View><Text>Total Today: {dashboard.totalToday}</Text><Text>Checked In Now: {dashboard.checkedInNow}</Text></View>}
  </SafeAreaView>;
}
