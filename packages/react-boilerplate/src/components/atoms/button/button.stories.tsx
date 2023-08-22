import React from 'react';
import { button } from './';
import { Story, Meta } from '@storybook/react/types-6-0';

type Props = React.ComponentProps<typeof button>

const csf: Meta = {
  title: 'atoms/button',
}

const Template: Story<Props> = (args) => <button {...args} />;

export const c1 = Template.bind({});
c1.storyName = 'default'

export default csf