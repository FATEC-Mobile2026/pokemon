# Projeto da Pokedex 

Projeto Expo + React Native com tela de login autenticada por nome/senha de Pokémon e dashboard com card estilizado ao estilo dark do PokedexLoginApp.

---

## 📁 Estrutura de Pastas

```
pokedex-login/
├── assets/images/            # Ícones e splash (herdados do projeto base)
├── src/
│   ├── app/
│   │   ├── _layout.tsx            # Root layout (AuthProvider + injeção de fontes web)
│   │   ├── (auth)/
│   │   │   └── index.tsx          # Tela de Login
│   │   └── (app)/
│   │       ├── _layout.tsx        # Guard de autenticação
│   │       └── dashboard.tsx      # Tela Dashboard
│   ├── components/
│   │   ├── alert/                 # Alert multiplataforma (web / android / ios)
│   │   ├── button/                # Botão estilizado
│   │   ├── card/                  # Card genérico
│   │   ├── icon/                  # Ícone SVG
│   │   ├── input/                 # Input estilizado (dark theme)
│   │   └── list/                  # Lista com FlatList
│   ├── constants/
│   │   └── colors.ts              # Paleta + cores por tipo de Pokémon
│   ├── context/
│   │   └── AuthContext.tsx        # Contexto de autenticação
│   └── data/
│       └── pokemons.ts            # Dados estáticos dos Pokémons autenticados
├── package.json
├── app.json
├── metro.config.js
└── tsconfig.json
```

---

## 🔐 Credenciais para Teste

| Nome (login)  | Senha           | 
|---------------|-----------------|
| Kleber Nunes     | kleber123    | 


## 🚀 Passo a Passo para Inicializar

### 1. Instalar dependências

```bash
cd pokedex-login
npm install
```

### 2. Rodar no Web

```bash
npx expo start 
```

Abrirá automaticamente em `http://localhost:8081` (ou porta disponível).  
Funciona em qualquer navegador moderno.

### 3. Rodar no Android

**Opção A — Expo Go (mais rápido)**
```bash
npx expo start
```
Escaneie o QR Code com o app **Expo Go** (disponível na Play Store).

**Opção B — Emulador Android Studio**
```bash
npx expo start --android
```
O emulador deve estar aberto antes de rodar o comando.


