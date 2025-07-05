// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'

export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    primary: '#303F9F',
                    secondary: '#212121',
                    background: '#121212',
                }
            }
        }
    }
})
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
