import { Attributor, Scope } from 'parchment';

class StartAttributor extends Attributor {}

const config = {
  scope: Scope.BLOCK,
};

const StartAttribute = new StartAttributor('start', 'start', config);

export default StartAttribute;
