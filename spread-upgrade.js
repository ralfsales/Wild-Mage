(() => {
  const SPREAD_SPEED_MULTIPLIER = 1.50;
  const BASE_PROJECTILE_SPEED = 420;
  const SPREAD_TRAVEL_DISTANCE = SKILLS.find(skill => skill.element === 'grass')?.range ?? 150;

  // Approved three-way spread-shot pickup artwork, embedded at 64px so it can
  // be served directly by GitHub Pages without an additional binary asset.
  const spreadUpgradeSprite = new Image();
  spreadUpgradeSprite.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAYNElEQVR42u1bd3xUVfb/3vempCeTXiedEoQEAiGhGASkSlEJINJBxEiVqqBjQFRwRaRJEFwQUExAEEQRUUGKi8ACUqT3FkJ6MpN59953fn9MUGBdd1d3dX+45/OZz3w+b+a9e08/33PPA/5HvysxwKb8Twwg9gdkmFgQMr180S3Gde33sYTfyfx6KgCD0dRttre561p3dI4A6v1R3IEUKEAYBkyMqLedgrsWUASe+xQ2GP4IAmAAKSGeDwdHqH/6LjK7SIYt07RIt7VakGFA898jKP7GErepIEZKlUcv3btRfa/e/uK+LkZy1GtqcBehE6GAXK5wjwogE60ABeSFyLKqJolIrA/c7y9UrUuoVA0tmgSyPh1BWTqQpd6DArAp29FK9zJ2TeJuyf0dDcP0NA8obUBMSVN1LaxumFlaGrj+m8TuRQtQoDDdT2O1ylOT2gQNVmUPVVPTBEPTlsCNTj5khmcpVEa/5b5+o4XyVCBHBKpjhilo1EULdecDQ6AUCka55cAYLzCvCDM0Y2JKsDL2BSBHu8eKnjzVy+uhwHA8uycm/gKFbiTtI+Kyw24u/DZwuYZzmXaMRGDLMoplC274Gvs1BNhvUhz9BhbACOgpWbU53t2QlFbVOUI0airVT3YBF7aD1T3FsHI9Q0qsYPpAH6cpqGmQOw94CIx+k/39JxdgAOA7udQSlkuBbuJsEfeO1b3aqKxLkI7P8oEWZqBPIrBtPZBcBaR0BSuvG09mxVL4O8UAm3Ln59e4fZ4CACazsY3TjC5uiEmStbyU+FRgwypCYTkj/6YM5oaAZgHenwuE6GAimTGm+zbFC5mG2wX5azPQj59/lGLZ7UvW/NlGyi9DbDYFRCzYs0/9IM/cm3Hv2fXHThJ378Ol11whFpRKuYULaVknJB4Rsv82LtOOS+Fj/ZhCld59Xer5tXGghgf290VZczndPRAjVkVgROdwZKXA0tZaw4ThV0jeAAUIx+QVcU1O06OcnFHTNImZQjY4K+QpLmW1EPKhQiGxVMjWyzQ5nIhHZ1/Tw/DKSZBNqdke+8XrA4B/ekQ4uqVEYHjrIIxc7YvOljt4z0KeCgBRbOaaGOs+CvfdTFa8fNyiDuoIBqgZ1Z1NGeV1kEWqyxr+ecl7GO9vaMXyssbjBW99QEjf97nMvM7lV8QlCSGJC3lKCtmnSkjvLUJ2PMxlxrukRRi2Vodg0CDXFv8FJWSS4RbcBgO8DF2aWzHjYIT3J3pU2LcUxV7bBIDd4rnGxIj5mLvHR+Hts/FTSKR8SppP1+sUhlx7CEaNQIvifoaMqiZ35vWf1Yrrt7BUj3BMPhpZ/yw1WU8iJk+Tj5zn8gsSkjQhSQipca4TF/KQEHKiXcjwDzSZvIlERIsyYcXrld6G3k3vMOWfrTXupFCMGhuFN697t7tKcetJi32WhBXvXrBgYH2XkGyKcmu/RE6V4NDt1eWsUwdd6b0sRFRO7e+mJDwxL2znwqfc9j9TxTpSjrnF9TigpwRz5amfzf/X9nMFxl2yohhuZ3S9fgjDuhWEvvsJb6uAAGBkjL5QgH6XgVnzCaGCIaQEJAsKmED1YUVU3XApKYl+Psj1lEi94sEekK+a6n1cN5Tl7DLGDJxdOuHJkM7Lw8Qj3aRSyRwAOKlGu/Eu/dkMYEAkhj7m27qQnrxITiJNTndK4b+fuP/9JRSGV0aiC+UbW1ODQDzTCyF9PW9pOyuP1Kw8Un+y35cEUySm7I6LKKKWeaT12q5JTOAi5hiX+zUhi7iQzS4LiWlcPrCUy857iEekazISs667uydH/Gy36DZ3DMToxzyij4SiA30UjHnDglKOCb+dJCdyyYk0fdI1chq6VJIVz4/4CbfKU0FgUZg6M7xjiWx7mZznBZekcX0lcRHwFWneaQcpAqNHgQFWZeH3YWzGAiDT7eejdJYKMPiaR7eKMbxTENuyzNllH/GkNzTJnhdyZrGQG7mQHvOEiBjD5aOHpEx8UlRHGvPJ3/DU6J83/R+zUogydVIkm1viUmLP7j4pO+1+m4gvlFwQF/I657JdAWkBj1TKGLz8ZxDYXS6Tp4IBYRjzfmzYQQrdTtU7SMjdDq4f0ITcTUJE7SPp3vkoheKlr2NC9pdGe+Tr3vAOAIAhrziG9p2hPQ0Atr8Jki4GglCvmdWwkRplSz1rt5DuE7h8/ICQ84qEwAQhum7msvVCcsZYjlKwklXD/DDjzzlZ4AiaitwNHpHG3NOxkUd4MKZtM3feo4V9Q/QJCXGCc/mlQ8h9pOnhe8gZEXWIIjBuR40FKLcVQj116MTKcXR0denurfa9wlwgVCpVQJOLgE0HwN5I5UhdmSTF0AEtZbMwb9Rpp1nYtGlIHWb0cFcf93aTDwJAvXq3O1eeCuTrodHnxlVYPu5dLT7sc23p52U3t6ssKBFUdRh0/Sgx/0ACLzawU9MPmspL5g8tZ2NrR4R+3wNYLP4muNlIAWyK2rl6RaXA6fCnPh9kjHkoRM+wQh08JLPRO2mGN9OFPHCQ2KjLDJcZUKaretUBYeJle/dU4rv+0IkBOfS3gUQBktAlwbve7uu9jpA4TVzU3sdl/Gguuy/h8ondXGYL0h65KETjt4hHWg5RCAb2+rvtbRsZAMAty5mfvpB4+EJqG4qpmxOTL1ODZcQfWsfl4C+4rLuMRJ1OdgrD3JOtc64/3GwyFXo0rZzCACB1n/Eno/1AauRjHtYuwrRRa2Aj6nZKiBHVpA3bK8TDy7msM4rL8M1CHiAuhp8hbm5ysDAB/Rq6VP6jUJXb4Krur9veveDZyM3j9JeTty6tUv8Kg5ztA2TVYahVCHy4CNhlE6r3CWJp3aTiO/o+Tl693grFyPEW46P1XJnhDhfQAYDilbd9QuRZYmDlyJ2kl13Rb+wCvMIJIfHA1WMQuFyhV+Kbl6QpJNIQLGFXjZt0GymIS9XvdKee0mTqVTdi2SNxbqLlco/+rZTGgyD9C4ntmCHUtfOJxV5j6FkLeD2QcBEGuTrXafA9/Pmb18OSL1lo5hqgp7zlAoY7w7bC3R3GXK5/M07uPlGYe6WR/3Af0MbDxN7JZqhuDCzaAhzPAwK9Cc2GQj1St4OlzBb5mufxPa8RAp8uBVvosgRGyGE6ADhfNW7ZgospflFRD6qml1rp3KEYioC2EUBCMLCqAuAOoXgp/v7bn2VzPNpVWhonG6JYDjv4o1URA5j0xuNdfbX093VrhofXqEao24nJbUs4u3iVwRjKMHAA0CcOGDALNP5BYOV1qM6vTxaq1Ts2mwtb/FmBqeZ5d/YeGUDMH4/7BGDSS+HqzJ1W5eOb4e9o+sirQlgGc9lmvZDXSMi5N4VseExIt0+ENM7nstVRLpK3EY9u65DR3p/JYLzw/N/WKKQqDPDrK8rCRt3MDTdMmBB7/xXaXkr8KpGWMsAugw25nwZ6T0hMHuxot3CTvLn0C6KmY7VsAEgdts8IMARi1JAo97WlMRkVst564pmnhfDL5dK0Xsj0U0LOLRKymITsvJlLz75cPvW9EOGrhR5m+Kw4XJm1wx9jZnkhK6hG++x2NEjAi6wYq8qLMHOGqlgaGNM6B0R6qjLQRMw3APj2DJBfCowMIPZeXSC3PfD2YIZADYzbnUr8ODdhtGYqBni2dz2a2G21tq4TMcTxqXY1oE6BcDtr4EVkZVDCAN2DmxW7uHLkZsVrp0hB7ZgIJSA5HvB0Y40BIMjso4ARVHg0Nfpn+saO85JuPk7FXExsTj+GJV2AZQnASH9gYwWw/XvA3Qfw9CAW461KQ6N2FoNqaVHePmlj5Wt59h95vgMO57i6sVmkFfO85vzizrPOC4pyJkDRrQ0YnApw0QQIwZDIifUnwG4E1nwOslwz6mw/1IqzW89UmL4ZDCIGvMhuLQLGCASUTnOfp5RACX9h1GvVdiEqK52oAIzapWNXtNjmxQEjKOe7827vLlonN772njz05f6q8UTENs9bxUE2pcCSO6H8xsZv+bZqo+9Ns75lPXBUAv0IrDYHkwLshpEg/ICoJIYCK6j8HBgu7yko4evSzRlPjPO4Ut4KyNGR5Src7srZSYR86O5qS2v11dV5F+Z/5yg5oih2EHlEA4M9AIMOqGAoYmDv3SR4VwIgRb+y6pwqHV9+WqGtP5mQ8KkJ9OIdaYZqXKFBV+Eza0pgbHF0BA7aiXYTlHP2knJzbIMjVQpOYSsr27BOfeyD5WpLbPErZowRkKMjCQaUlJQJvmN5Yf5JcpZD9wOw9jLwnQoCQKoOGuTGYI1nqFJ02M8Y6OobRxT71dVLDG71r1VtOd7PfsDnMwBAPpM/IYBjDGBEVOlnNMRnK3ZmvPwRh6wHNqQZ4TKAXAPoLwooQAEFOhi8jIy8T8NYfuHIZd3dd2VQ7YKc06c7OWsywg+Bpmc+lMyjYIW78X3uBl0w+LOD3IBLEqgMTvGt/jJsYz1FVDR4WgynQ7DjBKv44f6sPBXHcrTQxILxxqjHT5feOLTbfT+MgR6K7lMO1AJwUgWWqMA2AGMbAu4tGC5tEArKSLgbY0YLrep+7K5bge1Mv53ju2BmvgTy1CLquSpUjEz2JEzwSzdqilkzfPuVgtftQHgDINIfeCMSGBkO7IoGznwIZjbq8qpuPO2vux9MHuxoZ+B0fP8KdhFEDIxRfk+XxCNRml3aya2NV7I5kBmlICfI0+phVjN5h/sbY42XSTUEB2MlEVWxW+K7EcQ8W1OI8crNk06f1t97GhY5r50EK2yg0MRaEpcEkH0ROFcEnD0MpJsJwXV0oJlJeHr4mMTN62sr2PyVrvo/R/yDnuBRQo881YHS99WK82evr4cS4G2SXrWJmoJQvAh0YBbQdx/gZQS6Pkwoug+6SYnxDa24EBLc1ru4Vwe3z+rWM60OfJjCbDWBsPtzlPbYy3y6u3+Bu09ZNTwSgBtmYmerJLllwOLVUv1050nlu/2Hxeu+qeBgQKYNKkCs6X3N+rVpIY9e6h24WTnaTbqpCdbiaFDjh3XWwo/Q9zCw+w3g5gIgXSVYYokCQ0zy6odQ1JIzVzRcy8ULpNyqS/6BAHJ05ANlWHHAoe09bl/xteHg6HJj+UGjGpdh0Dv20VmsF1CwlDBuNzDAC4pHcwiZluxHSJlcJxLj+raB9mC6mmEyino5zGVyZpNMtXixieVGH5Pu1Av9NEK0D8NlCbTvzHhwU4bj2+mNT6Ybx0c4IJkNbHsOE+5p9ohWDdU5U/qrAd198A5Yk2xjneYJFS3ARwXpSs5R4MDboDgQHuyrI66xQa86aVT3P1NlrFq6w2Cv3HGlCMu3IQeuWPLPdYVdlVIVLo5zlC3OKF33Zv75pzeW7XnSYXAUGim5p6pHGYETO0AfXwJmtNNZyaOA2VzPdO5i6exN+2D66zF9F6mGgy6YTOyDF9XFC0cVBdy4EXZOHjjynPNEFZUzlWJ8iC5cgVJxQC+PDKBKANi+nQlX4CTmYB7c1wvlXp6AhxHCSPHsSiczJvYGrhYBn25liKrQWZ0eiu4oNbK/ZHPD6RFbq8vz53xeWfRWqyo6NqQGldIvbm77pF5p5xe6cUm4x5wvrRE7KbFTOaWvIt5llyZTD3H5pZ3LPzlJ83m8zJGA2V2aTqZhjQaWt/xJdMiAWtjcIfaJKhp/g7TPSDiTPyaKub96JQC0naANbz2WIgAgswZLZDzlzHpsNm0JxDstLc1OVQy+SOKw5CL9iBBtdnDZdDXxxEccFO6/ozpUeX2Xf9DqFT6Nr/X+9f3kpCMmwKa4N+Uz3O6nxa6LzdMj3OYdS2xVQk1mEO//PRevVAlpJ8m7HyLySDj5kQXwxQ9A5naARApspNTHDkt46/JvRh8hvZKEo+dmouAMx+pMGxnaPys2PDCWkm9Hfq57vQMCg3a91XAj0Q0SYqVdyP4XNJk+n3hCm0oK91x8Pj5+3otNum/IMLWk593TtRWuhswR068+2orOPOeGBteCn8mVec+9R4uAPtGR6rydceF7KfpxoT9zhAtOXB4jqYVOJIrz3rstoNlO77/btGRAWIuKTf33EX1EwpG2jGR00+pFf2d9NXXYPmM904YJlh46rbOTk4jLWVc0YR1LMib2OFmNC44DsE56lzaPmEt7kfCJuUHfa57/plPtGhOOqgpftpVo2VYiNKBgAMZQjBoX5bW1JOUlotEFQtwkLnufJO7bsoqy8GxQ6GjqGDNIywQRu7ubHNDIvuSVbUS7SVKdaeJ6nMVuTRuh2VKe0JoAxFyVGilggA0whde9VNBoO4mrxMX0Yi7SlpMeE3HYHolpiy1hWdbM+eT1wJPFye3GOpP//Sf7NQcjLUY6OrQcV90ZyFMjp9KiwPepViim9ogL/vaG73PCPrBAyCMkePxbJK2J5XPCBzvaoLsj/nZBRg8gvzpPaJkIp5TZ63Q6QUQNZvAD7qgK77+AKH2kGAMARHSrDGC1Agqmh0yRzs+F5NPKhPB4kxyxCcdKoj1y3wQDOtmo2UNTnXvunkL7j56phU6o7BT1NIW7+nCTm9Sud5U8l5BYUC34omrBA14kqmUtf77NZHo8vJc9yoUPiCUOorg6T8k/IcKZ/ORqIT8pJQqYLh5PSiJT6nCxLrEf1QUAWMgXQeSVElY+NOBpoueKhFjDufD5kBwJGYIiMXMoANhgUxr0veaZOdaRYLORclfQ/fcKISuL1Kysu7u/LklH4vM5ie0FRX1OYonkfMgJwRtOJDpwmWj4fPFVjVZ/3FwtatJ/KdGa80Ruw0W/2/OyzUbKsDn8r+MXir94t6ze1v0w6WuIO+N3EI/pRRTrvj0vvs3hXq3Gy5eBT8z/zCHfv5+ySL3lGt1tom+3WZUp8e6ncuLbCZGxnWgNcd7xM+GclSfLs+eLsQAxxoDGo6l2t1flp24tqPmQVeL80nNEpqf4I7UHUMywXPqh/TVqicxpP1ZerL1Ulr1Pgj+wl6S1C6faIWc/RPSe0BfeozPbThK1n8JnA8Bt97J/Rfu//OAxn8ljx/IZwEgx6W31Krc0LSfyXcOewqFX5vKLZy8oqi2T4bUDEOtm6V8DjKgHqTABEqhv9hNBaiJtKTAD3mEGoSj6M4ufZLz1REp76CVno/xn9V17OJR5veFZckNVjs7hdo+vbzxxoiDuEQSmCXsll+VVgE6oAIASyw9lLt31/VtMgADIPOcWM13sCSLyisONxIRB/Mq+MqI/XycKHSlO9bGWWn5oZ2dpmaGPyZfHXJBLcyVR0lLxfUpWdRIA9HlVbhg2S37i0UPkzbxIdE4Tsu4oXhSFwsYuYOhyweh+lQ0bZjtf/o2GG/9xlrDZbEpQdoFXQgcyA4AFzvopi2XpGZLVA/YT+Twmnms4SYxMmiCGPWQjj6hJctqoi1T5PglZf6Uo8a1PFoBYwsibPmEdnUMzN1HVaZL2VuvIbmlcPT76GaqTmkrGu6M7Y79sz/9RajCc7mtooxetY+SC7vuJviEhGq2XRfF95KL7nqdMALBO4a+OvU70PnGZvELYrS0rwwAgyYNCo96Qpz4mqY86R2R6SpuY9JycGfuM+OZWf/FWWr1VKv/XjMi4mpdAmV2rP2kQbG1qU+3N78p1e2+Cslsy/6vRVO/wdHwDGykQ2MsL9Qp3KCB3tk3nnk4CsQu9xcwuDygJmga+doV+ssdO+9vnL1FVRaHMduG0Gl/PYfr2HCb++ybCiJi1T6nl0Vf56swp4om4VPJNzJWnP+Ik++8lMg4RQ2/l0YEfiyPLK4nc11KTttPFE2nP0uo6f5anthKJZmtFiaUtWf//D8kRKdb+om/G27L0M06U9oG8GdidUjGh0HvwF/L6O0VEfgtE9tgnKSLgBXl5cbEUw78iMg0Sk9Xbx3Po/9VLFcSIajZds3H33rzHw0tk1coKovhZ4ljos7zHlJPC+ZUkavyNXKT0ElNGHiY59zCRZTCfrfzg7/fC2yTDyMgAIMWZ/HS+PPfKKaKgxeLw5lLhrCKpt/1KnG6/Tha9c54o6mn+J5fif+lg1n8r2cgwZA6FqJ1451lfCvsz14l2lAtJUugjL+n0QTFRq+l8FQDYvro153OP0K3ipcUr4uvMV8TUOhOdA1ZdJUchSa1aE+IQSdF3rTiK+yiEfgI63wPk0mbqJLI2n2S3AkDzJeJqARERCcfLZ4mUbDGCAUgdRkbc62SzkRKYrY0d8zXR+iKdwqaLv3bKotBbkPne5bzGvKkmM3ScKb4a8J7kaKJl/PR4zT1rAqSAiCUOqa4bM1B7ktXAa/xx6Q/35uhtLvHH1vz/6Hen/wN+66X1iKIqOQAAAABJRU5ErkJggg==';

  // Render the approved spread-shot pickup icon. This script loads after
  // energy-orbs.js, so blast pickups still keep their bomb artwork.
  const previousPickupDraw = Pickup.prototype.draw;
  Pickup.prototype.draw = function() {
    if (this.kind !== 'upgrade' || this.plannedUpgradeMode !== 'spread') {
      previousPickupDraw.call(this);
      return;
    }

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = '#14251f';
    ctx.fillRect(x - 3, y - 3, 24, 24);
    ctx.strokeStyle = '#62ddff';
    ctx.strokeRect(x - 3, y - 3, 24, 24);

    if (spreadUpgradeSprite.complete && spreadUpgradeSprite.naturalWidth) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spreadUpgradeSprite, x - 1, y - 1, 20, 20);
      ctx.restore();
    } else {
      ctx.fillStyle = '#8beaff';
      ctx.fillRect(x + 8, y + 2, 3, 15);
      ctx.fillRect(x + 3, y + 7, 3, 10);
      ctx.fillRect(x + 13, y + 7, 3, 10);
    }
  };

  // Tag only the projectiles created by an active spread-shot upgrade.
  const previousCast = Game.prototype.cast;
  Game.prototype.cast = function(...args) {
    const skill = SKILLS[this.player.selectedSkill];
    const spreadActive =
      this.state === 'playing' &&
      this.buffs.upgrade > 0 &&
      this.upgradeMode === 'spread' &&
      skill.element !== 'tame';
    const before = this.spells.length;
    const result = previousCast.apply(this, args);

    if (spreadActive) {
      for (let i = before; i < this.spells.length; i++) {
        this.spells[i].spreadUpgrade = true;
      }
    }
    return result;
  };

  // Spread shots fly 50% faster than conventional attacks. Their lifetime is
  // recalculated so every spread projectile travels exactly the grass shot's
  // normal linear range (150px), regardless of its element.
  const previousSpellUpdate = Spell.prototype.update;
  Spell.prototype.update = function(dt) {
    if (this.spreadUpgrade && !this.spreadSpeedBoosted) {
      this.vx *= SPREAD_SPEED_MULTIPLIER;
      this.vy *= SPREAD_SPEED_MULTIPLIER;
      this.life = SPREAD_TRAVEL_DISTANCE / (BASE_PROJECTILE_SPEED * SPREAD_SPEED_MULTIPLIER);
      this.spreadSpeedBoosted = true;
    }
    previousSpellUpdate.call(this, dt);
  };
})();