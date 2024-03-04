import assign from 'lodash/assign';

const defaultKeyProps = {
	x: 0, y: 0, x2: 0, y2: 0,                         // position
	width: 1, height: 1, width2: 1, height2: 1,       // size
	rotation_angle: 0, rotation_x: 0, rotation_y: 0,  // rotation
	labels: [],       // label properties
	profile: '', nub: false,        // cap appearance
	ghost: false, stepped: false, decal: false,       // miscellaneous options
	sm: '', sb: '', st: ''                              // switch
};

function deserializeError(msg, data) {
  throw 'Error: ' + msg + (data ? ':\n  ' + JSON.stringify(data) : '');
}

function isDisableKey(optKey, enableOpt) {
  if (typeof optKey !== 'string') return true;

  let conf = optKey.split('\n\n\n');
  if (conf.length === 2 && enableOpt.indexOf(conf[1]) === -1) {
    return false;
  }
  return true;
}

const KbSerial = {
  
  sortKeys: function (keys) {
    keys.sort(function (a, b) {
      return (
        ((a.rotation_angle + 360) % 360) - ((b.rotation_angle + 360) % 360) ||
        a.rotation_x - b.rotation_x ||
        a.rotation_y - b.rotation_y ||
        a.y - b.y ||
        a.x - b.x
      );
    });
  },
  deserialize(rows, layoutOpt = []) {
    rows = rows.map((row) => {
      return this.filterKeys(row, layoutOpt);
    });
    let current = JSON.parse(JSON.stringify(defaultKeyProps));
    let keys = [];
    let cluster = { x: 0, y: 0 };
    let align = 4;
    for (let r = 0; r < rows.length; ++r) {
      if (rows[r] instanceof Array) {
        for (let k = 0; k < rows[r].length; ++k) {
          let key = rows[r][k];
          if (typeof key === 'string') {
            let newKey = { ...current };
            newKey.width2 =
              newKey.width2 === 0 ? current.width : current.width2;
            newKey.height2 =
              newKey.height2 === 0 ? current.height : current.height2;
            newKey.labels = key.split(/[\n]+/g);
            newKey.posi = newKey.labels[0];
            keys.push(newKey);

            current.x += current.width;
            current.width = current.height = 1;
            current.x2 = current.y2 = current.width2 = current.height2 = 0;
            current.nub =
              current.stepped =
              current.decal =
              current.ghost =
                false;
          } else {
            if (key.r != null) {
              if (k !== 0) {
                deserializeError(
                  "'r' can only be used on the first key in a row",
                  key
                );
              }
              current.rotation_angle = key.r;
            }
            if (key.rx != null) {
              if (k !== 0) {
                deserializeError(
                  "'rx' can only be used on the first key in a row",
                  key
                );
              }
              current.rotation_x = cluster.x = key.rx;
              current = assign(current, cluster);
            }
            if (key.ry != null) {
              if (k !== 0) {
                deserializeError(
                  "ry' can only be used on the first key in a row",
                  key
                );
              }
              current.rotation_y = cluster.y = key.ry;
              current = assign(current, cluster);
            }
            if (key.a != null) {
              align = key.a;
            }
            if (key.p) {
              current.profile = key.p;
            }
            if (key.x != null) {
              current.x = key.isK ? key.x : current.x + key.x;
            }
            if (key.y) {
              current.y = key.isK ? key.y : current.y + key.y;
            }
            if (key.w) {
              current.width = current.width2 = key.w;
            }
            if (key.h) {
              current.height = current.height2 = key.h;
            }
            if (key.x2) {
              current.x2 = key.x2;
            }
            if (key.y2) {
              current.y2 = key.y2;
            }
            if (key.w2) {
              current.width2 = key.w2;
            }
            if (key.h2) {
              current.height2 = key.h2;
            }
            if (key.n) {
              current.nub = key.n;
            }
            if (key.l) {
              current.stepped = key.l;
            }
            if (key.d) {
              current.decal = key.d;
            }
            if (key.g != null) {
              current.ghost = key.g;
            }
            if (key.sm) {
              current.sm = key.sm;
            }
            if (key.sb) {
              current.sb = key.sb;
            }
            if (key.st) {
              current.st = key.st;
            }
            if (key.byte) {
              current.byte = key.byte;
            }
            if (key.label) {
              current.label = key.label;
            }
            if (key.isK) {
              keys.push(JSON.parse(JSON.stringify(current)));
            }
          }
        }
        current.y++;
      } else if (typeof rows[r] === 'object') {
        if (r !== 0) {
          throw (
            'Error: keyboard metadata must the be first element:\n  ' +
            JSON.stringify(rows[r])
          );
        }
      }
      current.x = current.rotation_x;
    }
    return keys;
  },

  filterKeys(keys, layoutOpt = []) {
    const enable = [];
    layoutOpt.forEach((opt, i) => {
      if (!opt.values) {
        enable.push(`${i},${opt.active?1:0}`);
      } else {
        enable.push(`${i},${opt.active}`);
      }
    });
    return keys.filter((key, i) => {
      if (typeof key === 'object') {
        return keys.length > i + 1 ? isDisableKey(keys[i+1], enable) : true;
      }
      if (key.indexOf('\n\n\n') === -1) {
        return true;
      }
      return isDisableKey(key, enable);
    }).map((key) => {
      if (typeof key === 'string' && key.indexOf('\n\n\n') === -1) {
        return key.split('\n\n\n')[0];
      }
      return key;
    });
  },
};


export default KbSerial;