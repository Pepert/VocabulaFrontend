import { cognitoLangExtraParams } from '../config';

describe('cognitoLangExtraParams', () => {
  it('maps each app UI language to the Cognito lang query parameter', () => {
    expect(cognitoLangExtraParams('en')).toEqual({ lang: 'en' });
    expect(cognitoLangExtraParams('fr')).toEqual({ lang: 'fr' });
  });
});
