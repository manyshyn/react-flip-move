import React, { Component } from 'react';
import ReactDOM             from 'react-dom';
import TestUtils            from 'react-addons-test-utils';

import FlipMove             from '../src/FlipMove';


describe('FlipMove', () => {
  describe('functionality', () => {
    // To test this, here is our setup:
    // We're making a simple list of news articles, with the ability to
    // change them from sorting ascending vs. descending.
    // Doing so will cause the items to be re-rendered in a different
    // order, and we want the transition to be animated.
    const articles = [
      { id: 'a', name: 'The Dawn of Time', timestamp: 123456 },
      { id: 'b', name: 'A While Back', timestamp: 333333 },
      { id: 'c', name: 'This Just Happened', timestamp: 654321 }
    ];

    // We need a list item, the thing we'll be moving about.
    const ListItem = class ListItem extends Component {
      render() {
        return <li id={this.props.id}>{this.props.name}</li>;
      }
    };
    // We need our list parent, which contains our FlipMove as well as
    // all the list items.
    const ListParent = class ListParent extends Component {
      constructor(props) {
        super(props);
        this.state = { articles };
      }

      renderArticles() {
        return this.state.articles.map( article => (
          <ListItem key={article.id} id={article.id} name={article.name} />
        ));
      }

      render() {
        return (
          <ul>
            <FlipMove duration={500}>
              { this.renderArticles() }
            </FlipMove>
          </ul>
        );
      }
    };

    let renderedComponent;

    before( () => {
      renderedComponent = ReactDOM.render(
        <ListParent />,
        document.getElementsByTagName('body')[0]
      );
    });

    it('renders the children components', () => {
      const outputComponents = TestUtils.scryRenderedComponentsWithType(
        renderedComponent, ListItem
      );

      const outputTags = TestUtils.scryRenderedDOMComponentsWithTag(
        renderedComponent, 'li'
      );

      expect(outputComponents).to.have.length.of(3);
      expect(outputTags).to.have.length.of(3);

      // Check that they're rendered in order
      expect(outputComponents[0].props.id).to.equal('a');
      expect(outputComponents[1].props.id).to.equal('b');
      expect(outputComponents[2].props.id).to.equal('c');
    });

    describe('updating state', () => {
      let originalPositions;

      before( () => {
        const outputTags = TestUtils.scryRenderedDOMComponentsWithTag(
          renderedComponent, 'li'
        );

        originalPositions = {
          a: outputTags[0].getBoundingClientRect(),
          b: outputTags[1].getBoundingClientRect(),
          c: outputTags[2].getBoundingClientRect(),
        }

        renderedComponent.setState({ articles: articles.reverse() });
      });

      it('has rearranged the components and DOM nodes', () => {
        const outputComponents = TestUtils.scryRenderedComponentsWithType(
          renderedComponent, ListItem
        );
        const outputTags = TestUtils.scryRenderedDOMComponentsWithTag(
          renderedComponent, 'li'
        );

        expect(outputComponents[0].props.id).to.equal('c');
        expect(outputComponents[1].props.id).to.equal('b');
        expect(outputComponents[2].props.id).to.equal('a');

        expect(outputTags[0].id).to.equal('c');
        expect(outputTags[1].id).to.equal('b');
        expect(outputTags[2].id).to.equal('a');
      });

      it('has not actually moved the elements on-screen', () => {
        // The animation has not started yet.
        // While the DOM nodes might have changed places, their on-screen
        // positions should be consistent with where they started.
        const newPositions = getNewPositions(renderedComponent)

        // Even though, in terms of the DOM, tag C is at the top,
        // its bounding box should still be the lowest
        expect(newPositions).to.deep.equal(originalPositions)
      });

      it('has stacked them all on top of each other after 250ms', (done) => {
        // We know the total duration of the animation is 500ms.
        // Three items are being re-arranged; top and bottom changing places.
        // Therefore, if we wait 250ms, all 3 items should be stacked.
        setTimeout(() => {
          const newPositions = getNewPositions(renderedComponent)

          // B should not move at all
          expect(newPositions.b).to.deep.equal(originalPositions.b);

          // A and C should be in roughly the same place as B.
          // This is not an exact science, so I'm just going to provide a range.
          const low_range = originalPositions.b.top * 0.9;
          const high_range = originalPositions.b.top * 1.1;
          expect(newPositions.a.top).to.be.within(low_range, high_range);
          expect(newPositions.c.top).to.be.within(low_range, high_range);

          done();
        }, 250)
      });

      it('has finished the animation after 500ms', (done) => {
        // Wait anothe 250ms (because tests are run sequentially, we know that
        // 250ms has already elapsed from the previous test.)
        setTimeout(() => {
          const newPositions = getNewPositions(renderedComponent)

          // B should still be in the same place.
          expect(newPositions.b).to.deep.equal(originalPositions.b);

          // A and C should have swapped places.
          expect(newPositions.a).to.deep.equal(originalPositions.c);
          expect(newPositions.c).to.deep.equal(originalPositions.a);

          done();
        }, 250)
      })
    });

  });
});

function getNewPositions(renderedComponent) {
  const outputTags = TestUtils.scryRenderedDOMComponentsWithTag(
    renderedComponent, 'li'
  );
  const [ tagC, tagB, tagA ] = outputTags;
  return {
    a: tagA.getBoundingClientRect(),
    b: tagB.getBoundingClientRect(),
    c: tagC.getBoundingClientRect()
  }
}
