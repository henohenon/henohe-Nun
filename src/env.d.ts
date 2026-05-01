// Must be a module for augmentation to work
export {}

declare module 'virtual:uno.css' {}

declare module '*.css' {}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    nunTemplate: 'nunTemplate'
    nunTemplateValue: 'nunTemplateValue'
    nunNwytProp: 'nunNwytProp'
    nunNwytPropMarker: 'nunNwytPropMarker'
    nunNwytPropKey: 'nunNwytPropKey'
    nunNwytPropClassMarker: 'nunNwytPropClassMarker'
    nunNwytPropClass: 'nunNwytPropClass'
    nunNwytPropSeparator: 'nunNwytPropSeparator'
    nunNwytPropValue: 'nunNwytPropValue'
    nwytContent: 'nwytContent'
    nwytContentMarker: 'nwytContentMarker'
    nwytContentKey: 'nwytContentKey'
    nwytContentClass: 'nwytContentClass'
    nwytContentValueMarker: 'nwytContentValueMarker'
    nwytContentValue: 'nwytContentValue'
    nwytContentUrlMarker: 'nwytContentUrlMarker'
    nwytContentUrl: 'nwytContentUrl'
    nunAdmonition: 'nunAdmonition'
    nunAdmonitionFenceOpen: 'nunAdmonitionFenceOpen'
    nunAdmonitionFenceClose: 'nunAdmonitionFenceClose'
    nunAdmonitionType: 'nunAdmonitionType'
    nunAdmonitionCollapse: 'nunAdmonitionCollapse'
    nunAdmonitionTitle: 'nunAdmonitionTitle'
    nunAdmonitionBody: 'nunAdmonitionBody'
  }
}
