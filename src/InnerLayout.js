import React from 'react';

const InnerLayout = ({ openedDescription, index, openDescription, point }) => {
  if (openedDescription !== index) {
    return (
      <div>
        <input
          type="button"
          onClick={() => {
            openDescription(index);
          }}
          value="Подробнее"
        />
      </div>
    );
  }
  return <div>{point.title}</div>;
};

export default InnerLayout;
