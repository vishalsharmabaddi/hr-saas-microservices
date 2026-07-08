import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8090',
  realm: 'worktrack',
  clientId: 'worktrack-frontend',
})

export default keycloak
