// Run this code inside the editor of https://jscomplete.com/playground

const _range = (min, max) => {
  const array = [];
  for(let i = min; i <= max; i++) {
    array.push(i);
  }
  return array;
}

const StarRating = ({onChange, value, max}) => {
  const stars = _range(1, max).map((num) => {
    return <StarButton
      active={num <= value}
      onClick={() => {onChange(num);}}
    />;
  });
  return <div>{stars}</div>;
};

const StarButton = ({onClick, active}) => {
  const icon = active ? '⭐️' : '☆';
  return <span onClick={onClick}>{icon}</span>;
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeRating = this.changeRating.bind(this);

    this.state = {
      rating: 0
    };
  }

  changeRating(rating) {
    this.setState({ rating });
  }

  render() {
    return (<div>
      <h1>Rating Demo</h1>
      <StarRating
        max={5}
        value={this.state.rating}
        onChange={this.changeRating}
      />
    </div>);
  }
}

ReactDOM.render(<App />, mountNode);
