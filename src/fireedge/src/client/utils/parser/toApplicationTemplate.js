import { STEP_ID as APPLICATION_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/BasicConfiguration'
import { STEP_ID as CLUSTER_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Clusters'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Networking'
import { STEP_ID as TIERS_ID } from 'client/containers/ApplicationsTemplates/Create/Steps/Tiers'

const mapNetworkToUserInput = network => {
  const { mandatory, description, type, idVnet, extra } = network

  const mandatoryValue = mandatory ? 'M' : 'O'
  const descriptionValue = description ?? ''
  const idVnetValue = idVnet ?? ''
  const extraValue = `:${extra}` ?? ''

  return `${mandatoryValue}|network|${descriptionValue}| |${type}:${idVnetValue}${extraValue}`
}

const mapTiersToRoles = (tiers, networking, cluster) =>
  tiers?.map(data => {
    const { template, networks, parents, position, tier } = data
    const { shutdown_action: action, ...information } = tier

    const networksValue = networks
      ?.reduce((res, id, idx) => {
        const network = networking.find(net => net.id === id)
        const networkString = `NIC = [\n NAME = "NIC${idx}",\n NETWORK_ID = "$${network.name}" ]\n`

        return [...res, networkString]
      }, [])
      ?.join('')
      ?.concat(`SCHED_REQUIREMENTS = "ClUSTER_ID="${cluster}""`)

    const parentsValue = parents?.reduce((res, id) => {
      const parent = tiers.find(t => t.id === id)
      return [...res, parent?.tier?.name]
    }, [])

    return {
      ...information,
      ...(action !== 'none' && { shutdown_action: action }),
      parents: parentsValue,
      vm_template: template?.id ?? template?.app,
      vm_template_contents: networksValue,
      elasticity_policies: [],
      scheduled_policies: [],
      position
    }
  })

const mapFormToApplication = data => {
  const {
    [APPLICATION_ID]: application,
    [NETWORKING_ID]: networking,
    [CLUSTER_ID]: cluster,
    [TIERS_ID]: tiers
  } = data

  const { shutdown_action: action, ...information } = application

  return {
    ...information,
    ...(action !== 'none' && { shutdown_action: action }),
    networks:
      networking?.reduce(
        (res, { name, ...network }) => ({
          ...res,
          [name]: mapNetworkToUserInput(network)
        }),
        {}
      ) ?? {},
    roles: mapTiersToRoles(tiers, networking, cluster)
  }
}

export default mapFormToApplication