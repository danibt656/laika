OBJ_D := bin
EXE := main

HEADERS = common.h chunk.h debug.h memory.h value.h vm.h
OBJECTS = $(EXE).o chunk.o debug.o memory.o value.o vm.o

all: dirs $(EXE)
	mv *.o $(EXE) $(OBJ_D)

dirs:
	mkdir $(OBJ_D)

$(EXE): $(OBJECTS)
	gcc $(OBJECTS) -o $@

%.o: %.c $(HEADERS)
	gcc -c $< -o $@

clean:
	-rm -f $(OBJ_D)/*.o
	-rm -f $(OBJ_D)/$(EXE)
	-rmdir $(OBJ_D)