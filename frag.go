package frag

type Wrap int

type Frag struct {
	Width    int
	Height   int
	Scale    float64
	FPS      float64
	WrapMode Wrap
	Filename string
	Source   string
}

const (
	WrapRepeat Wrap = iota
	WrapMirror
)

func (f *Frag) Run() error {
	return nil
}
